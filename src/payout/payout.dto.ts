import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

class PayoutPaymentDto {
  @ApiProperty()
  @Expose()
  @IsUUID()
  id: string;

  @ApiProperty()
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;
}

export class PayoutResponseDto {
  @ApiProperty()
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  totalAmount: number;

  @ApiProperty()
  @Expose()
  payments: PayoutPaymentDto[];
}
