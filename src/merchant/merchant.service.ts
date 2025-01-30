import { Injectable } from '@nestjs/common';
import { CreateMerchantDto, MerchantDto } from './merchant.dto';
import { PrismaService } from '../prisma.service';
import { v7 as uuidv7 } from 'uuid';
import { DefaultArgs, GetFindResult } from '@prisma/client/runtime/client';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
import { UtilsService } from '../utils.service';

@Injectable()
export class MerchantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
  ) {}

  async create(dto: CreateMerchantDto) {
    const { id } = await this.prisma.merchant.create({
      data: {
        id: uuidv7(),
        ...dto,
      },
    });
    return { id };
  }

  async findAll() {
    const results = await this.prisma.merchant.findMany({
      select: {
        id: true,
        name: true,
        commissionRate: true,
      },
      take: 100,
    });
    return results.map((record) => this.toDto(record));
  }

  async findOne(id: string) {
    const result = await this.prisma.merchant.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        commissionRate: true,
      },
    });
    if (result) {
      return this.toDto(result);
    }
    return result;
  }

  async remove(id: string) {
    try {
      return this.toDto(
        await this.prisma.merchant.delete({
          where: {
            id,
          },
        }),
      );
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        return null;
      }
      throw error;
    }
  }

  private toDto(
    record: GetFindResult<
      Prisma.$MerchantPayload<DefaultArgs>,
      {
        take: number;
        select: { commissionRate: boolean; name: boolean; id: boolean };
      },
      Prisma.PrismaClientOptions
    >,
  ) {
    return plainToInstance(
      MerchantDto,
      {
        ...record,
        // Map postgres/prisma Decimal to number
        commissionRate: this.utils.decimalToNumber(record.commissionRate),
      },
      { excludeExtraneousValues: true },
    );
  }
}
