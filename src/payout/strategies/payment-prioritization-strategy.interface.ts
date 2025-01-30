import { Payment } from '@prisma/client';

export interface PaymentPrioritizationStrategy {
  prioritizePaymentsForPayout(payments: Payment[]): Payment[];
}
