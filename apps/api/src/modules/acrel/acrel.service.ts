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
}
