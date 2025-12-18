import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SafetyInspectionsService } from './safety-inspections.service';

@ApiTags('فحوصات السلامة')
@Controller('v1/safety-inspections')
export class SafetyInspectionsController {
  constructor(private service: SafetyInspectionsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة فحوصات السلامة' })
  findAll(@Query('stationId') stationId?: string, @Query('status') status?: string) {
    return this.service.findAll({ stationId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل فحص' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'جدولة فحص جديد' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث فحص' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'إتمام الفحص' })
  complete(@Param('id') id: string, @Body() data: any) {
    return this.service.complete(id, data);
  }
}
