import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto, MerchantDto } from './merchant.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UtilsService } from '../utils.service';

@Controller('merchant')
export class MerchantController {
  constructor(
    private readonly service: MerchantService,
    private readonly utilsService: UtilsService,
  ) {}

  @ApiOperation({ summary: 'Create merchant' })
  @ApiResponse({
    status: 200,
    description: 'id of created merchant',
  })
  @Post()
  create(@Body() request: CreateMerchantDto) {
    return this.service.create(request);
  }

  @ApiOperation({ summary: 'Get all merchants' })
  @ApiResponse({
    status: 200,
    description: 'List of merchants',
    type: MerchantDto,
    isArray: true,
  })
  @Get()
  findAll(): Promise<MerchantDto[]> {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get merchant by id' })
  @ApiResponse({
    status: 200,
    description: 'Matching merchant',
    type: MerchantDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Merchant with such id does not exist',
    type: MerchantDto,
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.utilsService.throwIfNull(
      await this.service.findOne(id),
      new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Merchant with such id does not exist',
        },
        HttpStatus.NOT_FOUND,
      ),
    );
  }

  @ApiOperation({ summary: 'Remove merchant by id' })
  @ApiResponse({
    status: 200,
    description: 'Removed merchant',
    type: MerchantDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Merchant with such id does not exist',
    type: MerchantDto,
  })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.utilsService.throwIfNull(
      await this.service.remove(id),
      new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Merchant with such id does not exist',
        },
        HttpStatus.NOT_FOUND,
      ),
    );
  }
}
