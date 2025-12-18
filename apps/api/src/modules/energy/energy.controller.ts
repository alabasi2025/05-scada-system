import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EnergyService } from './energy.service';

@ApiTags('الطاقة - Energy')
@Controller('v1/scada/energy')
export class EnergyController {
  constructor(private readonly service: EnergyService) {}

  @Get('summary') @ApiOperation({ summary: 'ملخص الطاقة' }) getSummary(@Query('stationId') stationId?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) { return this.service.getSummary(stationId, startDate, endDate); }
  @Get('analysis/:stationId') @ApiOperation({ summary: 'تحليل الاستهلاك' }) getAnalysis(@Param('stationId') stationId: string) { return this.service.getConsumptionAnalysis(stationId); }
  @Get('dashboard') @ApiOperation({ summary: 'إحصائيات لوحة التحكم' }) getDashboard() { return this.service.getDashboardStats(); }
}
