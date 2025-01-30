import { Test, TestingModule } from '@nestjs/testing';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';
import { PrismaService } from '../prisma.service';
import { UtilsService } from '../utils.service';

describe('PayoutController', () => {
  let controller: PayoutController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayoutController],
      providers: [PrismaService, UtilsService, PayoutService],
    }).compile();

    controller = module.get<PayoutController>(PayoutController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
