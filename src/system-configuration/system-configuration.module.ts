import { Module } from '@nestjs/common';
import { SystemConfigurationService } from './system-configuration.service';
import { SystemConfigurationController } from './system-configuration.controller';
import { PrismaService } from '../prisma.service';
import { UtilsService } from '../utils.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [SystemConfigurationController],
  providers: [
    ConfigService,
    SystemConfigurationService,
    PrismaService,
    UtilsService,
  ],
})
export class SystemConfigurationModule {}
