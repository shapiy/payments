import {
  IsEnum,
  IsNotEmpty,
  IsPositive,
  IsOptional,
  Max,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConfigValueType } from '@prisma/client';

export class SystemConfigDto {
  // Coeff. A
  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(50.0)
  @IsOptional()
  feeFixed: number;
  // Coeff. B
  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(0.1)
  @IsOptional()
  feePercent: number;
  // Coeff. D
  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(0.5)
  @IsOptional()
  holdPercent: number;
}

export class UpsertSystemConfigValueDto {
  @IsEnum(ConfigValueType)
  type: ConfigValueType;

  @ApiProperty()
  @IsNotEmpty()
  value: string;
}
