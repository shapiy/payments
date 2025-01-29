import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import { UtilsService } from '../utils.service';

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        ConfigService,
        PaymentService,
        PrismaService,
        SystemConfigurationService,
        UtilsService,
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
