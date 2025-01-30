import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PayoutService } from './payout.service';
import { PayoutResponseDto } from './payout.dto';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SmallestAmountFirstStrategy } from './strategies/smallest-amount-first.strategy';
import { FifoPrioritizationStrategy } from './strategies/fifo-prioritization.strategy';
import { CompletedFirstPrioritizationStrategy } from './strategies/completed-first.strategy';
import { PaymentPrioritizationStrategy } from './strategies/payment-prioritization-strategy.interface';

export type PaymentPrioritizationStrategyType =
  | 'completed-first'
  | 'fifo'
  | 'smallest-first';

@Controller('payout')
export class PayoutController {
  private readonly strategies: Record<
    PaymentPrioritizationStrategyType,
    PaymentPrioritizationStrategy
  > = {
    'completed-first': new CompletedFirstPrioritizationStrategy(),
    fifo: new FifoPrioritizationStrategy(),
    'smallest-first': new SmallestAmountFirstStrategy(),
  };

  constructor(private readonly service: PayoutService) {}

  @ApiOperation({ summary: 'Process payout for merchant' })
  @ApiQuery({
    name: 'strategy',
    type: String,
    description:
      'Payment prioritization strategy: "completed-first", "fifo" or "smallest-first". Defaults to "completed-first".',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'payout details',
    type: PayoutResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('merchants/:merchantId')
  async createMerchantPayout(
    @Param('merchantId') merchantId: string,
    @Query('strategy') strategy?: PaymentPrioritizationStrategyType,
  ): Promise<PayoutResponseDto> {
    const paymentSelectionStrategy =
      this.strategies[strategy ?? 'smallest-first'];

    return await this.service.processMerchantPayout(
      merchantId,
      paymentSelectionStrategy,
    );
  }
}
