import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QualityService } from './quality.service';

@ApiTags('الجودة والسلامة - Quality & Safety')
@Controller('v1/scada/quality')
export class QualityController {
  constructor(private readonly service: QualityService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'مؤشرات جودة الطاقة' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getQualityMetrics(
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getQualityMetrics(stationId, startDate, endDate);
  }

  @Get('reliability')
  @ApiOperation({ summary: 'مؤشرات الموثوقية (SAIDI, SAIFI)' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'year', required: false })
  getReliabilityMetrics(
    @Query('stationId') stationId?: string,
    @Query('year') year?: string,
  ) {
    return this.service.getReliabilityMetrics(stationId, year ? parseInt(year) : undefined);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'قائمة الحوادث' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getIncidents(
    @Query('stationId') stationId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getIncidents(
      stationId,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Post('incidents')
  @ApiOperation({ summary: 'تسجيل حادث جديد' })
  createIncident(@Body() data: any) {
    return this.service.createIncident(data);
  }

  @Get('inspections')
  @ApiOperation({ summary: 'فحوصات السلامة' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getInspections(
    @Query('stationId') stationId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getInspections(
      stationId,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'إحصائيات الجودة للوحة التحكم' })
  getDashboard() {
    return this.service.getDashboardStats();
  }
}
