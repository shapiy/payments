import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SystemConfigurationService } from './system-configuration.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemConfigDto } from './system-configuration.dto';

@ApiTags('system-configuration')
@Controller('system-configuration')
export class SystemConfigurationController {
  constructor(private readonly service: SystemConfigurationService) {}

  @ApiOperation({ summary: 'Get config' })
  @ApiResponse({
    type: SystemConfigDto,
    status: 200,
    description: 'Current config',
  })
  @Get()
  async get(): Promise<SystemConfigDto> {
    return await this.service.get();
  }

  @ApiOperation({ summary: 'Upsert config values' })
  @ApiResponse({
    type: SystemConfigDto,
    status: 200,
    description: 'Updated config',
  })
  @Patch()
  updateDecimal(@Body() req: SystemConfigDto) {
    return this.service.upsert(req);
  }
}
