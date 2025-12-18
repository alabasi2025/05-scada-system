import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto, AlertQueryDto } from './dto';

@ApiTags('التنبيهات - Alerts')
@Controller('v1/scada/alerts')
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Post() @ApiOperation({ summary: 'إنشاء تنبيه' }) create(@Body() dto: CreateAlertDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'جلب التنبيهات' }) findAll(@Query() query: AlertQueryDto) { return this.service.findAll(query); }
  @Get('stats') @ApiOperation({ summary: 'إحصائيات التنبيهات' }) getStats() { return this.service.getStats(); }
  @Get(':id') @ApiOperation({ summary: 'جلب تنبيه' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Put(':id/acknowledge') @ApiOperation({ summary: 'الاعتراف بالتنبيه' }) acknowledge(@Param('id') id: string, @Body('userId') userId: string) { return this.service.acknowledge(id, userId); }
  @Put(':id/resolve') @ApiOperation({ summary: 'حل التنبيه' }) resolve(@Param('id') id: string, @Body('userId') userId: string, @Body('notes') notes?: string) { return this.service.resolve(id, userId, notes); }
}
