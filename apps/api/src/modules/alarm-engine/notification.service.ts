import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

interface AlarmNotification {
  alarm: {
    id: string;
    severity: string;
    message: string;
    value: number;
    threshold: number;
    triggeredAt: Date;
  };
  stationId: string;
  deviceId: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {}

  @OnEvent('alarm.triggered')
  async handleAlarmTriggered(payload: AlarmNotification): Promise<void> {
    const { alarm, stationId, deviceId } = payload;

    // جلب معلومات المحطة والجهاز
    const [station, device] = await Promise.all([
      this.prisma.scadaStation.findUnique({ where: { id: stationId } }),
      this.prisma.scadaDevice.findUnique({ where: { id: deviceId } }),
    ]);

    const notificationData = {
      alarmId: alarm.id,
      severity: alarm.severity,
      message: alarm.message,
      stationName: station?.name || 'غير معروف',
      stationCode: station?.code || '',
      deviceName: device?.name || 'غير معروف',
      deviceCode: device?.code || '',
      value: alarm.value,
      threshold: alarm.threshold,
      triggeredAt: alarm.triggeredAt,
    };

    // إرسال الإشعارات حسب الإعدادات
    await this.sendNotifications(notificationData);
  }

  private async sendNotifications(data: any): Promise<void> {
    // فحص إعدادات الإشعارات
    const emailEnabled = await this.settingsService.getTypedValue<boolean>('notification.email.enabled', false);
    const smsEnabled = await this.settingsService.getTypedValue<boolean>('notification.sms.enabled', false);
    const criticalNotification = await this.settingsService.getTypedValue<boolean>('alarm.critical.notification', true);

    // إرسال إشعارات للإنذارات الحرجة فقط إذا كان الإعداد مفعلاً
    if (data.severity === 'critical' && criticalNotification) {
      // تسجيل الإشعار في قاعدة البيانات
      await this.logNotification(data);

      if (emailEnabled) {
        await this.sendEmailNotification(data);
      }

      if (smsEnabled) {
        await this.sendSmsNotification(data);
      }

      // إشعار داخلي دائماً
      await this.sendInternalNotification(data);
    } else if (data.severity === 'major' || data.severity === 'warning') {
      // إشعار داخلي فقط للإنذارات غير الحرجة
      await this.sendInternalNotification(data);
    }
  }

  private async logNotification(data: any): Promise<void> {
    try {
      await this.prisma.scadaNotification.create({
        data: {
          alarmId: data.alarmId,
          type: 'alarm',
          severity: data.severity,
          title: `إنذار ${data.severity === 'critical' ? 'حرج' : 'تحذيري'}`,
          message: data.message,
          metadata: {
            stationName: data.stationName,
            stationCode: data.stationCode,
            deviceName: data.deviceName,
            deviceCode: data.deviceCode,
            value: data.value,
            threshold: data.threshold,
          },
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error logging notification: ${error.message}`);
    }
  }

  private async sendEmailNotification(data: any): Promise<void> {
    // في الإنتاج، سيتم استخدام خدمة بريد إلكتروني مثل SendGrid أو AWS SES
    this.logger.log(`[EMAIL] إرسال إشعار بريد إلكتروني للإنذار: ${data.alarmId}`);
    
    // محاكاة إرسال البريد
    const emailContent = `
      إنذار ${data.severity === 'critical' ? 'حرج' : 'تحذيري'} في نظام SCADA
      
      المحطة: ${data.stationName} (${data.stationCode})
      الجهاز: ${data.deviceName} (${data.deviceCode})
      الرسالة: ${data.message}
      القيمة: ${data.value}
      الحد: ${data.threshold}
      الوقت: ${data.triggeredAt}
    `;

    // TODO: تنفيذ إرسال البريد الفعلي
    this.logger.debug(`Email content: ${emailContent}`);
  }

  private async sendSmsNotification(data: any): Promise<void> {
    // في الإنتاج، سيتم استخدام خدمة SMS مثل Twilio
    this.logger.log(`[SMS] إرسال رسالة نصية للإنذار: ${data.alarmId}`);
    
    const smsContent = `إنذار SCADA: ${data.stationCode} - ${data.message}`;

    // TODO: تنفيذ إرسال SMS الفعلي
    this.logger.debug(`SMS content: ${smsContent}`);
  }

  private async sendInternalNotification(data: any): Promise<void> {
    // إشعار داخلي يتم إرساله عبر WebSocket
    this.logger.log(`[INTERNAL] إشعار داخلي للإنذار: ${data.alarmId}`);
    
    // الإشعار يتم إرساله تلقائياً عبر WebSocket Gateway
  }

  // إرسال إشعار مخصص
  async sendCustomNotification(params: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    userId?: string;
  }): Promise<void> {
    try {
      await this.prisma.scadaNotification.create({
        data: {
          type: params.type,
          severity: params.type === 'error' ? 'critical' : 'minor',
          title: params.title,
          message: params.message,
          userId: params.userId,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Custom notification sent: ${params.title}`);
    } catch (error) {
      this.logger.error(`Error sending custom notification: ${error.message}`);
    }
  }

  // جلب الإشعارات غير المقروءة
  async getUnreadNotifications(userId?: string): Promise<any[]> {
    const where: any = { isRead: false };
    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }

    return this.prisma.scadaNotification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  // تحديد الإشعار كمقروء
  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.scadaNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // تحديد جميع الإشعارات كمقروءة
  async markAllAsRead(userId?: string): Promise<void> {
    const where: any = { isRead: false };
    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }

    await this.prisma.scadaNotification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });
  }
}
