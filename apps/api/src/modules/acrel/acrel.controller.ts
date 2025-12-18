import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AcrelService } from './acrel.service';

@ApiTags('تكامل Acrel')
@Controller('v1/integrations/acrel')
export class AcrelController {
  constructor(private service: AcrelService) {}

  // Integrated Devices
  @Get('devices')
  @ApiOperation({ summary: 'قائمة الأجهزة المتكاملة' })
  findAllDevices(@Query('stationId') stationId?: string, @Query('deviceType') deviceType?: string, @Query('status') status?: string) {
    return this.service.findAllDevices({ stationId, deviceType, status });
  }

  @Post('devices')
  @ApiOperation({ summary: 'إضافة جهاز متكامل' })
  createDevice(@Body() data: any) {
    return this.service.createDevice(data);
  }

  @Put('devices/:id')
  @ApiOperation({ summary: 'تحديث جهاز متكامل' })
  updateDevice(@Param('id') id: string, @Body() data: any) {
    return this.service.updateDevice(id, data);
  }

  @Delete('devices/:id')
  @ApiOperation({ summary: 'حذف جهاز متكامل' })
  deleteDevice(@Param('id') id: string) {
    return this.service.deleteDevice(id);
  }

  // Sync Tasks
  @Get('sync-tasks')
  @ApiOperation({ summary: 'قائمة مهام المزامنة' })
  findAllSyncTasks(@Query('status') status?: string) {
    return this.service.findAllSyncTasks({ status });
  }

  @Post('sync-tasks')
  @ApiOperation({ summary: 'إنشاء مهمة مزامنة' })
  createSyncTask(@Body() data: any) {
    return this.service.createSyncTask(data);
  }

  // Communication Log
  @Get('communication-log')
  @ApiOperation({ summary: 'سجل الاتصالات' })
  findCommunicationLog(@Query('deviceId') deviceId?: string, @Query('direction') direction?: string) {
    return this.service.findCommunicationLog({ deviceId, direction });
  }

  // Meter Control Log
  @Get('meter-control-log')
  @ApiOperation({ summary: 'سجل التحكم بالعدادات' })
  findMeterControlLog(@Query('meterId') meterId?: string, @Query('actionType') actionType?: string) {
    return this.service.findMeterControlLog({ meterId, actionType });
  }

  // Acrel API Actions
  @Post('devices/:id/sync')
  @ApiOperation({ summary: 'مزامنة من Acrel' })
  syncFromAcrel(@Param('id') id: string) {
    return this.service.syncFromAcrel(id);
  }

  @Post('devices/:id/command')
  @ApiOperation({ summary: 'إرسال أمر إلى Acrel' })
  sendCommandToAcrel(@Param('id') id: string, @Body() command: any) {
    return this.service.sendCommandToAcrel(id, command);
  }

  // ==================== Webhooks ====================

  @Post('webhooks/readings')
  @ApiOperation({ summary: 'Webhook لاستقبال بيانات القراءات من Acrel' })
  handleReadingsWebhook(@Body() payload: any) {
    return this.service.handleReadingsWebhook(payload);
  }

  @Post('webhooks/alerts')
  @ApiOperation({ summary: 'Webhook لاستقبال التنبيهات من Acrel' })
  handleAlertsWebhook(@Body() payload: any) {
    return this.service.handleAlertsWebhook(payload);
  }

  @Post('webhooks/status')
  @ApiOperation({ summary: 'Webhook لاستقبال حالة الأجهزة من Acrel' })
  handleStatusWebhook(@Body() payload: any) {
    return this.service.handleStatusWebhook(payload);
  }

  @Post('webhooks/control')
  @ApiOperation({ summary: 'Webhook لاستقبال نتائج التحكم من Acrel' })
  handleControlWebhook(@Body() payload: any) {
    return this.service.handleControlWebhook(payload);
  }
}
