import { Injectable } from '@nestjs/common';
import { Payment } from '@prisma/client';
import { PaymentPrioritizationStrategy } from './payment-prioritization-strategy.interface';

@Injectable()
export class SmallestAmountFirstStrategy
  implements PaymentPrioritizationStrategy
{
  prioritizePaymentsForPayout(payments: Payment[]): Payment[] {
    return [...payments].sort(
      (a, b) => Number(a.availableAmount) - Number(b.availableAmount),
    );
  }
}
