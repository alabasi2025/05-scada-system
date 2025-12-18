import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AlarmEngineService } from './alarm-engine.service';
import { NotificationService } from './notification.service';

@ApiTags('محرك التنبيهات - Alarm Engine')
@Controller('alarm-engine')
export class AlarmEngineController {
  constructor(
    private readonly alarmEngineService: AlarmEngineService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('reload-rules')
  @ApiOperation({ summary: 'إعادة تحميل قواعد التنبيه' })
  @ApiResponse({ status: 200, description: 'تم إعادة تحميل القواعد' })
  async reloadRules() {
    await this.alarmEngineService.reloadRules();
    return { message: 'تم إعادة تحميل قواعد التنبيه' };
  }

  @Get('active-alarms')
  @ApiOperation({ summary: 'جلب مفاتيح الإنذارات النشطة' })
  @ApiResponse({ status: 200, description: 'قائمة مفاتيح الإنذارات النشطة' })
  getActiveAlarms() {
    return {
      activeAlarms: this.alarmEngineService.getActiveAlarmKeys(),
    };
  }

  @Post('check/:dataPointId')
  @ApiOperation({ summary: 'فحص قيمة يدوياً مقابل قواعد التنبيه' })
  @ApiParam({ name: 'dataPointId', description: 'معرف نقطة القياس' })
  @ApiBody({ schema: { type: 'object', properties: { value: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'نتيجة الفحص' })
  async manualCheck(
    @Param('dataPointId', ParseUUIDPipe) dataPointId: string,
    @Body('value') value: number,
  ) {
    return this.alarmEngineService.manualCheck(dataPointId, value);
  }

  // Notification endpoints
  @Get('notifications/unread')
  @ApiOperation({ summary: 'جلب الإشعارات غير المقروءة' })
  @ApiResponse({ status: 200, description: 'قائمة الإشعارات غير المقروءة' })
  async getUnreadNotifications() {
    return this.notificationService.getUnreadNotifications();
  }

  @Post('notifications/:id/read')
  @ApiOperation({ summary: 'تحديد إشعار كمقروء' })
  @ApiParam({ name: 'id', description: 'معرف الإشعار' })
  @ApiResponse({ status: 200, description: 'تم تحديد الإشعار كمقروء' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificationService.markAsRead(id);
    return { message: 'تم تحديد الإشعار كمقروء' };
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'تحديد جميع الإشعارات كمقروءة' })
  @ApiResponse({ status: 200, description: 'تم تحديد جميع الإشعارات كمقروءة' })
  async markAllAsRead() {
    await this.notificationService.markAllAsRead();
    return { message: 'تم تحديد جميع الإشعارات كمقروءة' };
  }

  @Post('notifications/send')
  @ApiOperation({ summary: 'إرسال إشعار مخصص' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['info', 'warning', 'error', 'success'] },
        title: { type: 'string' },
        message: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'تم إرسال الإشعار' })
  async sendCustomNotification(
    @Body() body: { type: 'info' | 'warning' | 'error' | 'success'; title: string; message: string; userId?: string },
  ) {
    await this.notificationService.sendCustomNotification(body);
    return { message: 'تم إرسال الإشعار' };
  }
}
