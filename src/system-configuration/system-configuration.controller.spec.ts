import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigurationController } from './system-configuration.controller';
import { SystemConfigurationService } from './system-configuration.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../utils.service';
import { SystemConfigDto } from './system-configuration.dto';

describe('SystemConfigurationController', () => {
  let service: SystemConfigurationService;
  let controller: SystemConfigurationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemConfigurationController],
      providers: [
        ConfigService,
        SystemConfigurationService,
        PrismaService,
        UtilsService,
      ],
    }).compile();

    service = module.get(SystemConfigurationService);
    controller = module.get<SystemConfigurationController>(
      SystemConfigurationController,
    );
  });

  describe('get', () => {
    it('should return config', async () => {
      const result: SystemConfigDto = {
        feeFixed: 0.1,
        feePercent: 0.05,
        holdPercent: 0.1,
      };
      jest
        .spyOn(service, 'get')
        .mockImplementation(() => Promise.resolve(result));

      expect(await controller.get()).toBe(result);
    });
  });
});
