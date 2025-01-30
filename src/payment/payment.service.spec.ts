/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import { UtilsService } from '../utils.service';
import Decimal from 'decimal.js';
import { PaymentStatus } from '@prisma/client';
import { CreatePaymentDto } from './payment.dto';
import { NegativeAmountException } from '../business.exception';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: PrismaService;
  let configService: SystemConfigurationService;

  const merchant = {
    id: 'merchant-1',
    name: 'ACME Corp.',
    commissionRate: new Decimal(0.025),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const systemConfig = {
    feeFixed: 1,
    feePercent: 0.015,
    holdPercent: 0.1,
  };

  const payment = {
    id: 'payment-1',
    merchantId: 'merchant-1',
    amount: new Decimal(100),
    status: PaymentStatus.ACCEPTED,
    systemFee: new Decimal(2.5),
    merchantCommission: new Decimal(2.5),
    holdAmount: new Decimal(10),
    availableAmount: new Decimal(95),
    createdAt: new Date(),
    updatedAt: new Date(),
    paidAt: null,
    payoutId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        PaymentService,
        PrismaService,
        SystemConfigurationService,
        UtilsService,
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<SystemConfigurationService>(
      SystemConfigurationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPaymentDto: CreatePaymentDto = {
      merchantId: 'merchant-1',
      amount: 100,
    };

    it('should successfully create a payment', async () => {
      jest.spyOn(prisma.merchant, 'findUnique').mockResolvedValue(merchant);
      jest.spyOn(configService, 'get').mockResolvedValue(systemConfig);
      jest.spyOn(prisma.payment, 'create').mockResolvedValue(payment);

      const result = await service.create(createPaymentDto);

      expect(result).toBeDefined();
      expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
        where: { id: createPaymentDto.merchantId },
      });
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          merchantId: createPaymentDto.merchantId,
          amount: new Decimal(createPaymentDto.amount),
          status: PaymentStatus.ACCEPTED,
        }),
      });
    });

    it('should return undefined when merchant not found', async () => {
      jest.spyOn(prisma.merchant, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.payment, 'create').mockResolvedValue(payment);

      const result = await service.create(createPaymentDto);

      expect(result).toBeUndefined();
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('should throw NegativeAmountException when available amount is negative', async () => {
      const highCommissionMerchant = {
        ...merchant,
        commissionRate: new Decimal(98.5), // 98.5% commission to ensure negative available amount
      };

      jest
        .spyOn(prisma.merchant, 'findUnique')
        .mockResolvedValue(highCommissionMerchant);
      jest.spyOn(configService, 'get').mockResolvedValue(systemConfig);
      jest.spyOn(prisma.payment, 'create').mockResolvedValue(payment);

      await expect(service.create(createPaymentDto)).rejects.toThrow(
        NegativeAmountException,
      );
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('should calculate fees correctly', async () => {
      jest.spyOn(prisma.merchant, 'findUnique').mockResolvedValue(merchant);
      jest.spyOn(configService, 'get').mockResolvedValue(systemConfig);
      jest.spyOn(prisma.payment, 'create').mockResolvedValue(payment);

      await service.create(createPaymentDto);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          systemFee: new Decimal(2.5), // $1 + (1.5% of $100)
          merchantCommission: new Decimal(2.5), // 2.5% of $100
          holdAmount: new Decimal(10), // 10% of $100
          availableAmount: new Decimal(95), // $100 - $2.5 - $2.5
        }),
      });
    });
  });
});
