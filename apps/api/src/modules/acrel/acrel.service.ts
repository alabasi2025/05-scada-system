import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AcrelService {
  private readonly logger = new Logger(AcrelService.name);

  constructor(private prisma: PrismaService) {}

  // Integrated Devices
  async findAllDevices(params: { stationId?: string; deviceType?: string; status?: string }) {
    const { stationId, deviceType, status } = params;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (deviceType) where.deviceType = deviceType;
    if (status) where.status = status;

    return this.prisma.integrated_devices.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createDevice(data: any) {
    return this.prisma.integrated_devices.create({ data });
  }

  async updateDevice(id: string, data: any) {
    return this.prisma.integrated_devices.update({ where: { id }, data });
  }

  async deleteDevice(id: string) {
    return this.prisma.integrated_devices.delete({ where: { id } });
  }

  // Sync Tasks
  async findAllSyncTasks(params: { status?: string }) {
    const { status } = params;
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.sync_tasks.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async createSyncTask(data: any) {
    return this.prisma.sync_tasks.create({ data });
  }

  async updateSyncTask(id: string, data: any) {
    return this.prisma.sync_tasks.update({ where: { id }, data });
  }

  // Communication Log
  async findCommunicationLog(params: { deviceId?: string; direction?: string }) {
    const { deviceId, direction } = params;
    const where: any = {};
    if (deviceId) where.deviceId = deviceId;
    if (direction) where.direction = direction;

    return this.prisma.device_communication_log.findMany({ where, orderBy: { communicationTime: 'desc' }, take: 100 });
  }

  async logCommunication(data: any) {
    return this.prisma.device_communication_log.create({ data });
  }

  // Meter Control Log
  async findMeterControlLog(params: { meterId?: string; actionType?: string }) {
    const { meterId, actionType } = params;
    const where: any = {};
    if (meterId) where.meterId = meterId;
    if (actionType) where.actionType = actionType;

    return this.prisma.meter_control_log.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async logMeterControl(data: any) {
    return this.prisma.meter_control_log.create({ data });
  }

  // Acrel API Integration (Placeholder)
  async syncFromAcrel(deviceId: string) {
    this.logger.log(`Syncing from Acrel device: ${deviceId}`);
    // TODO: Implement actual Acrel API integration
    return { success: true, message: 'Sync initiated', deviceId };
  }

  async sendCommandToAcrel(deviceId: string, command: any) {
    this.logger.log(`Sending command to Acrel device: ${deviceId}`, command);
    // TODO: Implement actual Acrel API integration
    return { success: true, message: 'Command sent', deviceId, command };
  }

  // ==================== Webhooks ====================

  /**
   * معالجة webhook لبيانات القراءات
   */
  async handleReadingsWebhook(payload: any) {
    this.logger.log('Received readings webhook from Acrel', payload);
    
    try {
      const { deviceId, readings, timestamp } = payload;
      
      // التحقق من وجود الجهاز
      const device = await this.prisma.integrated_devices.findFirst({
        where: { deviceCode: deviceId }
      });

      if (!device) {
        this.logger.warn(`Device not found: ${deviceId}`);
        return { success: false, error: 'Device not found' };
      }

      // تسجيل الاتصال
      await this.logCommunication({
        deviceId: device.id,
        direction: 'inbound',
        protocol: 'webhook',
        payload: JSON.stringify(payload),
        status: 'success',
        communicationTime: new Date(timestamp || Date.now()),
      });

      // تحديث آخر مزامنة
      await this.updateDevice(device.id, {
        lastSyncAt: new Date(),
        status: 'online'
      });

      return { success: true, message: 'Readings processed', recordsCount: readings?.length || 0 };
    } catch (error: any) {
      this.logger.error('Error processing readings webhook', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * معالجة webhook للتنبيهات
   */
  async handleAlertsWebhook(payload: any) {
    this.logger.log('Received alerts webhook from Acrel', payload);
    
    try {
      const { deviceId, alertType, severity, message, timestamp } = payload;
      
      // البحث عن الجهاز
      const device = await this.prisma.integrated_devices.findFirst({
        where: { deviceCode: deviceId }
      });

      if (device) {
        // إنشاء تنبيه جديد
        await this.prisma.alerts.create({
          data: {
            alertCode: `ACREL-${Date.now()}`,
            alertType: alertType || 'integration',
            severity: severity || 'warning',
            title: `Acrel Alert: ${alertType}`,
            message: message || 'Alert from Acrel device',
            sourceType: 'acrel_integration',
            sourceId: device.id,
            stationId: device.stationId,
            status: 'active',
            triggeredAt: new Date(timestamp || Date.now()),
          }
        });
      }

      return { success: true, message: 'Alert processed' };
    } catch (error: any) {
      this.logger.error('Error processing alerts webhook', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * معالجة webhook لحالة الجهاز
   */
  async handleStatusWebhook(payload: any) {
    this.logger.log('Received status webhook from Acrel', payload);
    
    try {
      const { deviceId, status, timestamp } = payload;
      
      const device = await this.prisma.integrated_devices.findFirst({
        where: { deviceCode: deviceId }
      });

      if (device) {
        await this.updateDevice(device.id, {
          status: status === 'online' ? 'online' : 'offline',
          lastCommunication: new Date(timestamp || Date.now()),
        });
      }

      return { success: true, message: 'Status updated' };
    } catch (error: any) {
      this.logger.error('Error processing status webhook', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * معالجة webhook لأوامر التحكم
   */
  async handleControlWebhook(payload: any) {
    this.logger.log('Received control webhook from Acrel', payload);
    
    try {
      const { deviceId, meterId, actionType, result, timestamp } = payload;
      
      // تسجيل نتيجة التحكم
      await this.logMeterControl({
        meterId: meterId || deviceId,
        actionType: actionType || 'unknown',
        actionResult: result || 'received',
        executedAt: new Date(timestamp || Date.now()),
      });

      return { success: true, message: 'Control result logged' };
    } catch (error: any) {
      this.logger.error('Error processing control webhook', error);
      return { success: false, error: error.message };
    }
  }
}
