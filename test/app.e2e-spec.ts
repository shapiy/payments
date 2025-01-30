/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { PaymentStatus } from '@prisma/client';
import { execSync } from 'child_process';

describe('Payments (e2e)', () => {
  let app: INestApplication<App>;
  let container: StartedPostgreSqlContainer;

  // eslint-disable-next-line @typescript-eslint/require-await
  const runMigrations = async (databaseUrl: string) => {
    execSync(`DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`, {
      stdio: 'inherit',
    });
  };

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer().start();

    // Create test-specific DATABASE_URL
    const databaseUrl = `postgresql://test:test@${container.getHost()}:${container.getMappedPort(
      5432,
    )}/testdb?schema=public`;
    process.env.DATABASE_URL = databaseUrl;

    await runMigrations(databaseUrl);
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Payments API');
  });

  it('Runs the payout flow', async () => {
    const updateConfigResponse = await request(app.getHttpServer())
      .patch('/system-configuration')
      .send({
        // Fixed fee: 5 UAH (or whatever currency — the API is currency agnostic)
        feeFixed: 5,
        // Percent fee: 1%
        feePercent: 0.01,
        // Hold percent: 10%
        holdPercent: 0.1,
      })
      .expect(200);

    expect(updateConfigResponse.body).toEqual({
      feeFixed: 5,
      feePercent: 0.01,
      holdPercent: 0.1,
    });

    const createMerchantResponse = await request(app.getHttpServer())
      .post('/merchant')
      .send({
        name: 'ACME Corp.',
        // Shop commission rate 5%
        commissionRate: 0.05,
      })
      .expect(201);
    const merchantId = createMerchantResponse.body.id as string;

    const createPaymentResponse1 = await request(app.getHttpServer())
      .post('/payment')
      .send({
        merchantId,
        amount: 100,
      })
      .expect(201);
    const paymentId1 = createPaymentResponse1.body.id as string;

    const createPaymentResponse2 = await request(app.getHttpServer())
      .post('/payment')
      .send({
        merchantId,
        amount: 200,
      })
      .expect(201);
    const paymentId2 = createPaymentResponse2.body.id as string;

    const handlePayoutResponse1 = await request(app.getHttpServer())
      .post(`/payout/merchants/${merchantId}`)
      .send({
        merchantId,
      })
      .expect(200);
    // Nothing to process, payments are in ACCEPTED status
    expect(handlePayoutResponse1.body).toEqual({
      payments: [],
      totalAmount: 0,
    });

    // Move all payments to PROCESSED stage
    await request(app.getHttpServer())
      .post('/payment/_process')
      .send({
        paymentIds: [paymentId1, paymentId2],
      })
      .expect(200);
    const handlePayoutResponse2 = await request(app.getHttpServer())
      .post(`/payout/merchants/${merchantId}`)
      .send({
        merchantId,
      })
      .expect(200);
    // Only can process the payout for the first payment because of hold amount
    expect(handlePayoutResponse2.body).toEqual({
      payments: [
        {
          amount: 89,
          id: paymentId1,
        },
      ],
      totalAmount: 89,
    });

    // Move unprocessed payments to COMPLETE stage
    await request(app.getHttpServer())
      .post('/payment/_complete')
      .send({
        paymentIds: [paymentId2],
      })
      .expect(200);
    const handlePayoutResponse3 = await request(app.getHttpServer())
      .post(`/payout/merchants/${merchantId}`)
      .send({
        merchantId,
      })
      .expect(200);
    // Finally can process payment 2 because hold money are no longer reserved
    expect(handlePayoutResponse3.body).toEqual({
      payments: [
        {
          amount: 183,
          id: paymentId2,
        },
      ],
      totalAmount: 183,
    });

    // Finally, check all payment statuses
    const getPaymentsResponse = await request(app.getHttpServer())
      .get(`/payment`)
      .expect(200);
    expect(getPaymentsResponse.body).toEqual([
      {
        id: paymentId1,
        amount: 100,
        availableAmount: 89,
        holdAmount: 10,
        systemFee: 6,
        merchantCommission: 5,
        merchantId: merchantId,
        status: PaymentStatus.PAID_OUT,
      },
      {
        id: paymentId2,
        amount: 200,
        availableAmount: 183,
        holdAmount: 20,
        systemFee: 7,
        merchantCommission: 10,
        merchantId: merchantId,
        status: PaymentStatus.PAID_OUT,
      },
    ]);

    return merchantId;
  });
});
