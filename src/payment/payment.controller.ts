import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreatePaymentDto,
  PaymentDto,
  UpdatePaymentsResultDto,
  UpdatePaymentsStatusDto,
} from './payment.dto';
import { UtilsService } from '../utils.service';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly prisma: PrismaService,
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

  @ApiOperation({ summary: 'Process payments' })
  @ApiResponse({
    status: 200,
    description: 'Status update result',
    type: UpdatePaymentsResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Payments not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Payments with invalid status',
  })
  @HttpCode(HttpStatus.OK)
  @Post('_process')
  async processPayments(@Body() { paymentIds }: UpdatePaymentsStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.validatePaymentsForStatusUpdate(
        tx,
        paymentIds,
        PaymentStatus.ACCEPTED,
      );
      const count = await this.service.markPaymentsAsProcessed(tx, paymentIds);

      return {
        statusCode: HttpStatus.OK,
        message: `Successfully processed ${count} payment(s)`,
        processedCount: count,
      };
    });
  }

  @ApiOperation({ summary: 'Complete payments' })
  @ApiResponse({
    status: 200,
    description: 'Status update result',
    type: UpdatePaymentsResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Payments with invalid status',
  })
  @HttpCode(HttpStatus.OK)
  @Post('_complete')
  async completePayments(@Body() { paymentIds }: UpdatePaymentsStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.validatePaymentsForStatusUpdate(
        tx,
        paymentIds,
        PaymentStatus.PROCESSED,
      );
      const count = await this.service.markPaymentsAsCompleted(tx, paymentIds);

      return {
        statusCode: HttpStatus.OK,
        message: `Successfully completed ${count} payment(s)`,
        processedCount: count,
      };
    });
  }

  private async validatePaymentsForStatusUpdate(
    tx: Prisma.TransactionClient,
    paymentIds: string[],
    fromStatus: PaymentStatus,
  ) {
    const payments = await this.service.findMany(tx, paymentIds);

    if (payments.length !== paymentIds.length) {
      const foundIds = payments.map((p) => p.id);
      const notFound = paymentIds.filter((id) => !foundIds.includes(id));
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Payments not found: ${notFound.join(', ')}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const invalidPayments = payments.filter((p) => p.status !== fromStatus);
    if (invalidPayments.length > 0) {
      const error = `Payments with invalid status: ${invalidPayments.map((p) => p.id).join(', ')}. Expected: ${fromStatus}`;
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return payments;
  }
}
