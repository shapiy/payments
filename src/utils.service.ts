import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class UtilsService {
  throwIfNull = <T>(
    value: T | null | undefined,
    error: Error | string = 'Not found',
  ): T => {
    if (value == null) {
      throw error instanceof Error ? error : new Error(error);
    }
    return value;
  };

  prismaDecimalToNumber(decimal: Prisma.Decimal): number {
    return Number(decimal.toFixed(2));
  }

  roundDecimal(availableAmount: Decimal) {
    return availableAmount.toFixed(2);
  }
}
