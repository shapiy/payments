import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SystemConfigDto } from './system-configuration.dto';
import { ConfigService } from '@nestjs/config';
import { ConfigValueType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SystemConfigurationService {
  private static readonly KEY_FEE_FIXED = 'fee_fixed';
  private static readonly KEY_FEE_PERCENT = 'fee_percent';
  private static readonly KEY_HOLD_PERCENT = 'hold_percent';

  private static readonly keyToPropertyMap: Record<
    string,
    keyof SystemConfigDto
  > = {
    [SystemConfigurationService.KEY_FEE_FIXED]: 'feeFixed',
    [SystemConfigurationService.KEY_FEE_PERCENT]: 'feePercent',
    [SystemConfigurationService.KEY_HOLD_PERCENT]: 'holdPercent',
  };
  private static readonly allowedKeys = Object.keys(
    SystemConfigurationService.keyToPropertyMap,
  );

  private readonly defaultValues: Map<string, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.defaultValues = new Map();
    this.defaultValues.set(
      SystemConfigurationService.KEY_FEE_FIXED,
      configService.get<string>('SYSTEM_CONFIG_FEE_FIXED_DEFAULT')!,
    );
    this.defaultValues.set(
      SystemConfigurationService.KEY_FEE_PERCENT,
      configService.get<string>('SYSTEM_CONFIG_FEE_PERCENT_DEFAULT')!,
    );
    this.defaultValues.set(
      SystemConfigurationService.KEY_HOLD_PERCENT,
      configService.get<string>('SYSTEM_CONFIG_HOLD_PERCENT_DEFAULT')!,
    );
  }

  private setDecimalProperty(key: string, value: string, dto: SystemConfigDto) {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      const property = SystemConfigurationService.keyToPropertyMap[key];
      if (property) {
        dto[property] = numericValue;
      }
    }
  }

  public configArrayToDto(
    configs: { key: string; value: string; type: ConfigValueType }[],
  ): SystemConfigDto {
    const dto = new SystemConfigDto();

    this.defaultValues.forEach((value, key) => {
      if (!(key in SystemConfigurationService.keyToPropertyMap)) {
        return;
      }
      // Currently, only decimal values are supported.
      this.setDecimalProperty(key, value, dto);
    });

    configs.forEach(({ key, value, type }) => {
      if (type !== ConfigValueType.DECIMAL) {
        return;
      }
      if (!(key in SystemConfigurationService.keyToPropertyMap)) {
        return;
      }
      // Currently, only decimal values are supported.
      this.setDecimalProperty(key, value, dto);
    });
    return plainToInstance(SystemConfigDto, dto);
  }

  public static dtoToConfigArray(
    dto: SystemConfigDto,
  ): { key: string; value: string }[] {
    return Object.entries(SystemConfigurationService.keyToPropertyMap)
      .map(([key, property]) => {
        const value = dto[property];
        return value !== undefined ? { key, value: value.toString() } : null;
      })
      .filter(
        (entry): entry is { key: string; value: string } => entry !== null,
      );
  }

  async get(): Promise<SystemConfigDto> {
    const result = await this.prisma.systemConfigValue.findMany({
      select: { key: true, value: true, type: true },
      where: {
        key: { in: SystemConfigurationService.allowedKeys },
      },
    });
    return this.configArrayToDto(result);
  }

  async upsert(config: SystemConfigDto) {
    const configs = SystemConfigurationService.dtoToConfigArray(config);
    await this.prisma.$transaction(
      configs.map(({ key, value }) =>
        this.prisma.systemConfigValue.upsert({
          where: { key },
          update: { value },
          // Currently, only decimal values are supported.
          create: { key, value, type: ConfigValueType.DECIMAL },
        }),
      ),
    );
    return await this.get();
  }
}
