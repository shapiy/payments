import { Module } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';
import { PrismaService } from '../prisma.service';
import { UtilsService } from '../utils.service';

@Module({
  controllers: [PayoutController],
  providers: [PayoutService, PrismaService, UtilsService],
})
export class PayoutModule {}
