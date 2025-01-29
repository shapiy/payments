import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigurationService } from './system-configuration.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../utils.service';

describe('SystemConfigurationService', () => {
  let service: SystemConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        SystemConfigurationService,
        PrismaService,
        UtilsService,
      ],
    }).compile();

    service = module.get<SystemConfigurationService>(
      SystemConfigurationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
