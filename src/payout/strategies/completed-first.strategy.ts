import { Injectable } from '@nestjs/common';
import { Payment, PaymentStatus } from '@prisma/client';
import { PaymentPrioritizationStrategy } from './payment-prioritization-strategy.interface';

@Injectable()
export class CompletedFirstPrioritizationStrategy
  implements PaymentPrioritizationStrategy
{
  prioritizePaymentsForPayout(payments: Payment[]): Payment[] {
    return [...payments].sort((a, b) => {
      // prioritize COMPLETED
      if (a.status !== b.status) {
        return a.status === PaymentStatus.COMPLETED ? -1 : 1;
      }

      // otherwise, maintain original order (createdAt)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }
}
