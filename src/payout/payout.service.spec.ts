import { Test, TestingModule } from '@nestjs/testing';
import { PayoutService } from './payout.service';
import { PrismaService } from '../prisma.service';
import { UtilsService } from '../utils.service';
import { Payment, PaymentStatus, Payout } from '@prisma/client';
import { PaymentPrioritizationStrategy } from './strategies/payment-prioritization-strategy.interface';
import Decimal from 'decimal.js';

const createPayment = (payment: Partial<Payment>): Payment => {
  const defaults: Payment = {
    id: 'payment',
    merchantId: 'merchant',
    amount: Decimal(0),
    status: PaymentStatus.ACCEPTED,
    holdAmount: Decimal(0),
    systemFee: Decimal(0),
    merchantCommission: Decimal(0),
    availableAmount: Decimal(0),
    createdAt: new Date(),
    updatedAt: new Date(),
    paidAt: new Date(),
    payoutId: null,
  };

  return { ...defaults, ...payment };
};

const createPayout = (payout: Partial<Payout>): Payout => {
  const defaults: Payout = {
    id: 'payout',
    merchantId: 'merchant',
    amount: Decimal(0),
    status: 'completed',
    createdAt: new Date(),
    processedAt: new Date(),
  };

  return { ...defaults, ...payout };
};

describe('PayoutService', () => {
  let service: PayoutService;
  let prisma: PrismaService;

  // Mock strategy that returns payments unchanged
  const mockStrategy: PaymentPrioritizationStrategy = {
    prioritizePaymentsForPayout: (payments: Payment[]) => payments,
  };

  const mockUtils = {
    decimalToNumber: jest.fn((decimal: Decimal) => Number(decimal)),
  };

  const mockTransaction = jest
    .fn()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    .mockImplementation((callback) => callback(prisma));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: mockTransaction,
            payment: {
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
            payout: {
              create: jest.fn(),
            },
          },
        },
        PayoutService,
        UtilsService,
        {
          provide: UtilsService,
          useValue: mockUtils,
        },
      ],
    }).compile();

    service = module.get<PayoutService>(PayoutService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should process completed payments successfully', async () => {
    const payments: Payment[] = [
      createPayment({
        id: '1',
        merchantId: 'merchant1',
        status: PaymentStatus.COMPLETED,
        availableAmount: new Decimal(100),
        holdAmount: new Decimal(0),
        payoutId: null,
      }),
      createPayment({
        id: '2',
        merchantId: 'merchant1',
        status: PaymentStatus.COMPLETED,
        availableAmount: new Decimal(200),
        holdAmount: new Decimal(50),
      }),
    ];

    jest.spyOn(prisma.payment, 'findMany').mockResolvedValue(payments);
    jest.spyOn(prisma.payout, 'create').mockResolvedValue(
      createPayout({
        id: 'payout1',
        amount: new Decimal(300),
      }),
    );

    const result = await service.processMerchantPayout(
      'merchant1',
      mockStrategy,
    );

    expect(result.totalAmount).toBe(300);
    expect(result.payments).toEqual([
      { amount: 100, id: '1' },
      { amount: 200, id: '2' },
    ]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.payment.updateMany).toHaveBeenCalled();
  });

  it('should skip payments when insufficient funds', async () => {
    const payments: Payment[] = [
      createPayment({
        id: '1',
        merchantId: 'merchant1',
        status: PaymentStatus.COMPLETED,
        availableAmount: new Decimal(100),
        holdAmount: new Decimal(0),
        payoutId: null,
      }),
      createPayment({
        id: '2',
        merchantId: 'merchant1',
        status: PaymentStatus.PROCESSED,
        availableAmount: new Decimal(200),
        holdAmount: new Decimal(50),
      }),
    ];

    jest.spyOn(prisma.payment, 'findMany').mockResolvedValue(payments);
    jest.spyOn(prisma.payout, 'create').mockResolvedValue(
      createPayout({
        id: 'payout1',
        amount: new Decimal(100),
      }),
    );

    const result = await service.processMerchantPayout(
      'merchant1',
      mockStrategy,
    );

    expect(result.totalAmount).toBe(100);
    expect(result.payments).toEqual([{ amount: 100, id: '1' }]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.payment.updateMany).toHaveBeenCalled();
  });

  it('should handle empty eligible payments', async () => {
    jest.spyOn(prisma.payment, 'findMany').mockResolvedValue([]);

    const result = await service.processMerchantPayout(
      'merchant1',
      mockStrategy,
    );

    expect(result.totalAmount).toBe(0);
    expect(result.payments).toHaveLength(0);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.payout.create).not.toHaveBeenCalled();
  });
});
