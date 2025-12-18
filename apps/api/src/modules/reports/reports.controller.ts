import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private parseFilters(
    stationId?: string,
    deviceId?: string,
    from?: string,
    to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('تنسيق التاريخ غير صحيح');
    }

    return {
      stationId,
      deviceId,
      from: fromDate,
      to: toDate,
    };
  }

  @Get('performance')
  @ApiOperation({ summary: 'تقرير الأداء' })
  @ApiQuery({ name: 'stationId', required: false, description: 'معرف المحطة' })
  @ApiQuery({ name: 'from', required: false, description: 'تاريخ البداية (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'تاريخ النهاية (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'تقرير الأداء' })
  async getPerformanceReport(
    @Query('stationId') stationId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const filters = this.parseFilters(stationId, undefined, from, to);
    return this.reportsService.getPerformanceReport(filters);
  }

  @Get('consumption')
  @ApiOperation({ summary: 'تقرير الاستهلاك' })
  @ApiQuery({ name: 'stationId', required: false, description: 'معرف المحطة' })
  @ApiQuery({ name: 'from', required: false, description: 'تاريخ البداية (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'تاريخ النهاية (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'تقرير الاستهلاك' })
  async getConsumptionReport(
    @Query('stationId') stationId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const filters = this.parseFilters(stationId, undefined, from, to);
    return this.reportsService.getConsumptionReport(filters);
  }

  @Get('alarms')
  @ApiOperation({ summary: 'تقرير التنبيهات' })
  @ApiQuery({ name: 'stationId', required: false, description: 'معرف المحطة' })
  @ApiQuery({ name: 'from', required: false, description: 'تاريخ البداية (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'تاريخ النهاية (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'تقرير التنبيهات' })
  async getAlarmsReport(
    @Query('stationId') stationId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const filters = this.parseFilters(stationId, undefined, from, to);
    return this.reportsService.getAlarmsReport(filters);
  }

  @Get('kpi')
  @ApiOperation({ summary: 'تقرير مؤشرات الأداء الرئيسية (KPI)' })
  @ApiQuery({ name: 'stationId', required: false, description: 'معرف المحطة' })
  @ApiQuery({ name: 'from', required: false, description: 'تاريخ البداية (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'تاريخ النهاية (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'تقرير KPI' })
  async getKPIReport(
    @Query('stationId') stationId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const filters = this.parseFilters(stationId, undefined, from, to);
    return this.reportsService.getKPIReport(filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'ملخص شامل' })
  @ApiResponse({ status: 200, description: 'ملخص شامل للنظام' })
  async getSummary() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const filters = { from: thirtyDaysAgo, to: now };

    const [performance, alarms, kpi] = await Promise.all([
      this.reportsService.getPerformanceReport(filters),
      this.reportsService.getAlarmsReport(filters),
      this.reportsService.getKPIReport(filters),
    ]);

    return {
      generatedAt: now,
      period: filters,
      performance: performance.summary,
      alarms: alarms.summary,
      kpis: kpi.kpis,
    };
  }
}
