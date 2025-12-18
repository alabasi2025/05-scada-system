import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SecurityService } from './security.service';

@ApiTags('الأمان - Security')
@Controller('v1/scada/security')
export class SecurityController {
  constructor(private readonly service: SecurityService) {}

  @Get('cameras')
  @ApiOperation({ summary: 'قائمة الكاميرات' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'status', required: false })
  getCameras(
    @Query('stationId') stationId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getCameras(stationId, status);
  }

  @Get('access-logs')
  @ApiOperation({ summary: 'سجل الدخول' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAccessLogs(
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAccessLogs(
      stationId,
      startDate,
      endDate,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Post('access-logs')
  @ApiOperation({ summary: 'تسجيل دخول جديد' })
  createAccessLog(@Body() data: any) {
    return this.service.createAccessLog(data);
  }

  @Get('events')
  @ApiOperation({ summary: 'أحداث الأمان' })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getSecurityEvents(
    @Query('stationId') stationId?: string,
    @Query('eventType') eventType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getSecurityEvents(
      stationId,
      eventType,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Post('events')
  @ApiOperation({ summary: 'تسجيل حدث أمان جديد' })
  createSecurityEvent(@Body() data: any) {
    return this.service.createSecurityEvent(data);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'إحصائيات الأمان للوحة التحكم' })
  getDashboard() {
    return this.service.getDashboardStats();
  }
}
