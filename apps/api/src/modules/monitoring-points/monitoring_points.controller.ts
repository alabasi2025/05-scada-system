import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringPointsService } from './monitoring_points.service';
import { CreateMonitoringPointDto, UpdateMonitoringPointDto, MonitoringPointQueryDto } from './dto';

@ApiTags('نقاط المراقبة - Monitoring Points')
@Controller('v1/scada/monitoring-points')
export class MonitoringPointsController {
  constructor(private readonly service: MonitoringPointsService) {}

  @Post() @ApiOperation({ summary: 'إنشاء نقطة مراقبة' }) create(@Body() dto: CreateMonitoringPointDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'جلب نقاط المراقبة' }) findAll(@Query() query: MonitoringPointQueryDto) { return this.service.findAll(query); }
  @Get(':id') @ApiOperation({ summary: 'جلب نقطة مراقبة' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Put(':id') @ApiOperation({ summary: 'تحديث نقطة مراقبة' }) update(@Param('id') id: string, @Body() dto: UpdateMonitoringPointDto) { return this.service.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'حذف نقطة مراقبة' }) remove(@Param('id') id: string) { return this.service.remove(id); }
}
