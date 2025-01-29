import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMerchantDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  // Coeff. C
  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(0.1)
  @IsOptional()
  commissionRate: number;
}

export class MerchantIdDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class MerchantDto extends IntersectionType(
  CreateMerchantDto,
  MerchantIdDto,
) {}
