import { Injectable } from '@nestjs/common';
import { Payment } from '@prisma/client';
import { PaymentPrioritizationStrategy } from './payment-prioritization-strategy.interface';

@Injectable()
export class FifoPrioritizationStrategy
  implements PaymentPrioritizationStrategy
{
  prioritizePaymentsForPayout(payments: Payment[]): Payment[] {
    // Already ordered by createdAt in query, but better safe than sorry :)
    return [...payments].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }
}
