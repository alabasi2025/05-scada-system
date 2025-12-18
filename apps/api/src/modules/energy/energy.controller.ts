import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EnergyService } from './energy.service';

@ApiTags('الطاقة - Energy')
@Controller('v1/scada/energy')
export class EnergyController {
  constructor(private readonly service: EnergyService) {}

  @Get('summary')
  @ApiOperation({ summary: 'ملخص الطاقة' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getSummary(
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: string,
  ) {
    return this.service.getSummary(stationId, startDate, endDate, period);
  }

  @Get('consumption')
  @ApiOperation({ summary: 'تحليل الاستهلاك حسب القطاع' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getConsumption(
    @Query('stationId') stationId?: string,
    @Query('period') period?: string,
  ) {
    return this.service.getConsumptionAnalysis(stationId, period);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'توقعات الطلب على الطاقة' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'days', required: false })
  getForecast(
    @Query('stationId') stationId?: string,
    @Query('days') days?: string,
  ) {
    return this.service.getForecast(stationId, days ? parseInt(days) : 7);
  }

  @Get('losses')
  @ApiOperation({ summary: 'تحليل الفقد في الشبكة' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getLosses(
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getLosses(stationId, startDate, endDate);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'إحصائيات لوحة التحكم' })
  getDashboard() {
    return this.service.getDashboardStats();
  }

  @Get('analysis/:stationId')
  @ApiOperation({ summary: 'تحليل الاستهلاك لمحطة محددة' })
  getAnalysis(@Param('stationId') stationId: string) {
    return this.service.getConsumptionAnalysis(stationId);
  }
}
