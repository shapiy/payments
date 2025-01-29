import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { PrismaService } from '../prisma.service';
import { UtilsService } from '../utils.service';

@Module({
  controllers: [MerchantController],
  providers: [MerchantService, PrismaService, UtilsService],
})
export class MerchantModule {}
