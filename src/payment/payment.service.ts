import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import Decimal from 'decimal.js';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { CreatePaymentDto, PaymentDto } from './payment.dto';
import { plainToInstance } from 'class-transformer';
import { v7 as uuidv7 } from 'uuid';
import { NegativeAmountException } from '../business.exception';
import { UtilsService } from '../utils.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemConfigurationService: SystemConfigurationService,
    private readonly utils: UtilsService,
  ) {}

  async create(dto: CreatePaymentDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: dto.merchantId },
    });
    if (!merchant) {
      return undefined;
    }
    // All config values should be initialized with at least defaults.
    const config = await this.systemConfigurationService.get();

    const amount = new Decimal(dto.amount);
    const hundred = new Decimal(100);

    const configFeeFixed = new Decimal(config.feeFixed);
    const configFeePercent = new Decimal(config.feePercent);
    const configHoldPercent = new Decimal(config.holdPercent);
    const merchantCommissionRate = new Decimal(merchant.commissionRate);

    // Coeff. A + B
    const systemFee = configFeeFixed.plus(
      amount.mul(configFeePercent).div(hundred),
    );
    // Coeff. C
    const merchantCommission = amount.mul(merchantCommissionRate).div(hundred);
    // Coeff. D
    const holdAmount = amount.mul(configHoldPercent).div(hundred);

    const availableAmount = amount.minus(systemFee).minus(merchantCommission);

    if (availableAmount.isNegative()) {
      throw new NegativeAmountException(
        this.utils.roundDecimal(availableAmount),
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        id: uuidv7(),
        merchantId: dto.merchantId,
        amount,
        status: PaymentStatus.ACCEPTED,
        systemFee,
        merchantCommission,
        holdAmount,
        availableAmount,
      },
    });
    return this.toDto(payment);
  }

  async findAll() {
    const results = await this.prisma.payment.findMany({
      take: 100,
    });
    return results.map((record) => this.toDto(record));
  }

  async findMany(tx: Prisma.TransactionClient, ids: string[]) {
    const results = await tx.payment.findMany({
      where: {
        id: { in: ids },
      },
    });
    return results.map((record) => this.toDto(record));
  }

  async findOne(id: string) {
    const result = await this.prisma.payment.findUnique({
      where: {
        id,
      },
    });
    if (result) {
      return this.toDto(result);
    }
    return result;
  }

  async markPaymentsAsProcessed(
    tx: Prisma.TransactionClient,
    paymentIds: string[],
  ) {
    const results = await tx.payment.updateMany({
      where: {
        id: { in: paymentIds },
        status: PaymentStatus.ACCEPTED,
      },
      data: {
        status: PaymentStatus.PROCESSED,
      },
    });

    return results.count;
  }

  async markPaymentsAsCompleted(
    tx: Prisma.TransactionClient,
    paymentIds: string[],
  ) {
    const results = await tx.payment.updateMany({
      where: {
        id: { in: paymentIds },
        status: PaymentStatus.PROCESSED,
      },
      data: {
        status: PaymentStatus.COMPLETED,
      },
    });

    return results.count;
  }

  private toDto(payment: Payment) {
    const {
      amount,
      systemFee,
      merchantCommission,
      holdAmount,
      availableAmount,
    } = payment;
    return plainToInstance(
      PaymentDto,
      {
        ...payment,
        amount: this.utils.decimalToNumber(amount),
        systemFee: this.utils.decimalToNumber(systemFee),
        merchantCommission: this.utils.decimalToNumber(merchantCommission),
        holdAmount: this.utils.decimalToNumber(holdAmount),
        availableAmount: this.utils.decimalToNumber(availableAmount),
      },
      { excludeExtraneousValues: true },
    );
  }
}
