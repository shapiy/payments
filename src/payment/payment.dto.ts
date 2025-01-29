import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty()
  @Expose()
  @IsUUID()
  merchantId: string;

  @ApiProperty()
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

export class PaymentIdDto {
  @ApiProperty()
  @Expose()
  @IsUUID()
  id: string;
}

export class PaymentDetailsDto {
  @ApiProperty()
  @Expose()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty()
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  holdAmount: number;

  @ApiProperty()
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  systemFee: number;

  @ApiProperty()
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  merchantCommission: number;

  @ApiProperty()
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  availableAmount: number;
}

export class PaymentDto extends IntersectionType(
  CreatePaymentDto,
  PaymentIdDto,
  PaymentDetailsDto,
) {}

export class UpdatePaymentsStatusDto {
  @ApiProperty()
  @Expose()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  paymentIds: string[];
}

export class UpdatePaymentsResultDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  statusCode: number;
  @ApiProperty()
  @Expose()
  @IsString()
  message: string;
  @ApiProperty()
  @Expose()
  @IsNumber()
  processedCount: number;
}
