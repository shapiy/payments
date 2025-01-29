import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from '../prisma.service';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import { UtilsService } from '../utils.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [PaymentController],
  providers: [
    ConfigService,
    PaymentService,
    PrismaService,
    SystemConfigurationService,
    UtilsService,
  ],
})
export class PaymentModule {}
