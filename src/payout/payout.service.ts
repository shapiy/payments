import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentPrioritizationStrategy } from './strategies/payment-prioritization-strategy.interface';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { PayoutResponseDto } from './payout.dto';
import { v7 as uuidv7 } from 'uuid';
import Decimal from 'decimal.js';
import { UtilsService } from '../utils.service';

const PROCESS_PAYOUT_MAX_BATCH = 100;

@Injectable()
export class PayoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
  ) {}

  async processMerchantPayout(
    merchantId: string,
    strategy: PaymentPrioritizationStrategy,
  ): Promise<PayoutResponseDto> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const eligiblePayments = await tx.payment.findMany({
        where: {
          merchantId,
          status: { in: [PaymentStatus.PROCESSED, PaymentStatus.COMPLETED] },
          payoutId: null,
        },
        orderBy: { createdAt: 'asc' },
        // Just a sanity limit to avoid OOM, HTTP timeouts, etc.
        // This means we cannot use all the available balance if there are more than PROCESS_PAYOUT_MAX_BATCH
        // PROCESSED and COMPLETED payments for this merchant.
        take: PROCESS_PAYOUT_MAX_BATCH,
      });

      if (eligiblePayments.length === 0) {
        return { totalAmount: 0, payments: [] };
      }

      const prioritizedPayments =
        strategy.prioritizePaymentsForPayout(eligiblePayments);

      const selectedPayments =
        this.selectPaymentsForPayout(prioritizedPayments);

      if (selectedPayments.length === 0) {
        return { totalAmount: 0, payments: [] };
      }

      const totalAmount = selectedPayments.reduce(
        (sum, payment) => sum.plus(payment.availableAmount),
        new Decimal(0),
      );

      const payout = await tx.payout.create({
        data: {
          merchantId,
          id: uuidv7(),
          amount: totalAmount,
          status: 'completed',
        },
      });
      await tx.payment.updateMany({
        where: {
          id: { in: selectedPayments.map((p) => p.id) },
        },
        data: {
          status: PaymentStatus.PAID_OUT,
          payoutId: payout.id,
          paidAt: new Date(),
        },
      });
      return {
        totalAmount: this.utils.decimalToNumber(totalAmount),
        payments: selectedPayments.map((payment) => ({
          id: payment.id,
          amount: this.utils.decimalToNumber(payment.availableAmount),
        })),
      };
    });
  }

  private selectPaymentsForPayout(payments: Payment[]): Payment[] {
    let remainingBalance = this.computeRemainingBalance(payments);
    const selectedPayments: Payment[] = [];

    for (const payment of payments) {
      const paymentAmount = payment.availableAmount;

      if (remainingBalance.gte(paymentAmount)) {
        selectedPayments.push(payment);
        remainingBalance = remainingBalance.minus(paymentAmount);
      }
    }
    return selectedPayments;
  }

  private computeRemainingBalance(payments: Payment[]) {
    return payments.reduce(
      (total, payment) => total.plus(this.computeAvailableAmount(payment)),
      new Decimal(0),
    );
  }

  private computeAvailableAmount(payment: Payment) {
    if (payment.status === PaymentStatus.COMPLETED) {
      // For COMPLETED payments, we can ignore the holdAmount
      return payment.availableAmount;
    } else if (payment.status === PaymentStatus.PROCESSED) {
      // For PROCESSED payments, we cannot use holdAmount
      return new Decimal(payment.availableAmount).minus(payment.holdAmount);
    } else {
      throw new Error(`Unexpected payment status: ${payment.status}`);
    }
  }
}
