import { Injectable } from '@nestjs/common';

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
}
