import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentDto, PaymentDto } from './payment.dto';
import { UtilsService } from '../utils.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly service: PaymentService,
    private readonly utilsService: UtilsService,
  ) {}

  @ApiOperation({ summary: 'Create payment' })
  @ApiResponse({
    status: 200,
    description: 'id of created payment',
  })
  @ApiResponse({
    status: 404,
    description: 'Merchant with such id does not exist',
  })
  @ApiResponse({
    status: 422,
    description: 'Payment refused. Net amount cannot be negative',
  })
  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.utilsService.throwIfNull(
      await this.service.create(dto),
      new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Merchant with such id does not exist',
        },
        HttpStatus.NOT_FOUND,
      ),
    );
  }

  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({
    status: 200,
    description: 'List of payments',
    type: PaymentDto,
    isArray: true,
  })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get payment by id' })
  @ApiResponse({
    status: 200,
    description: 'Matching payment',
    type: PaymentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Payment with such id does not exist',
  })
  async findOne(@Param('id') id: string) {
    return this.utilsService.throwIfNull(
      await this.service.findOne(id),
      new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Payment with such id does not exist',
        },
        HttpStatus.NOT_FOUND,
      ),
    );
  }
}
