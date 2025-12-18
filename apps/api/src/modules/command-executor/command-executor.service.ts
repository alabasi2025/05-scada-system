import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ModbusClientService } from '../data-collector/modbus-client.service';

export interface CommandExecutionResult {
  success: boolean;
  commandId: string;
  message: string;
  executedAt?: Date;
  error?: string;
}

export interface ApprovalRequest {
  commandId: string;
  requestedBy: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class CommandExecutorService {
  private readonly logger = new Logger(CommandExecutorService.name);

  // أوامر تتطلب موافقة
  private readonly criticalCommands = [
    'OPEN_BREAKER',
    'CLOSE_BREAKER',
    'EMERGENCY_STOP',
    'RESET_PROTECTION',
    'CHANGE_SETPOINT',
    'ENABLE_REMOTE',
    'DISABLE_REMOTE',
  ];

  // مستويات الصلاحيات
  private readonly permissionLevels = {
    operator: 1,
    supervisor: 2,
    engineer: 3,
    admin: 4,
  };

  constructor(
    private prisma: PrismaService,
    private modbusClient: ModbusClientService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * إنشاء أمر تحكم جديد
   */
  async createCommand(data: {
    deviceId: string;
    dataPointId?: string;
    commandType: string;
    commandValue: any;
    requestedBy: string;
    reason?: string;
    priority?: string;
  }): Promise<any> {
    // التحقق من وجود الجهاز
    const device = await this.prisma.scadaDevice.findUnique({
      where: { id: data.deviceId },
      include: { station: true },
    });

    if (!device) {
      throw new BadRequestException('الجهاز غير موجود');
    }

    // التحقق من حالة الجهاز
    if (device.status !== 'active') {
      throw new BadRequestException('الجهاز غير نشط');
    }

    // تحديد ما إذا كان الأمر يتطلب موافقة
    const requiresApproval = this.criticalCommands.includes(data.commandType);

    // إنشاء الأمر
    const command = await this.prisma.scadaCommand.create({
      data: {
        commandNo: `CMD-${Date.now()}`,
        deviceId: data.deviceId,
        commandType: data.commandType,
        targetValue: JSON.stringify(data.commandValue),
        status: requiresApproval ? 'pending_approval' : 'pending',
        requestedBy: data.requestedBy,
        reason: data.reason,
      },
    });

    // تسجيل الحدث
    await this.logEvent({
      type: 'COMMAND_CREATED',
      entityType: 'command',
      entityId: command.id,
      description: `تم إنشاء أمر ${data.commandType} للجهاز ${device.code}`,
      userId: data.requestedBy,
      metadata: { commandType: data.commandType, deviceId: data.deviceId },
    });

    // إرسال إشعار إذا كان يتطلب موافقة
    if (requiresApproval) {
      this.eventEmitter.emit('command.approval_required', {
        commandId: command.id,
        commandType: data.commandType,
        deviceCode: device.code,
        stationCode: device.station.code,
        requestedBy: data.requestedBy,
      });
    }

    return command;
  }

  /**
   * الموافقة على أمر
   */
  async approveCommand(
    commandId: string,
    approvedBy: string,
    approverRole: string,
  ): Promise<any> {
    const command = await this.prisma.scadaCommand.findUnique({
      where: { id: commandId },
      include: { device: true },
    });

    if (!command) {
      throw new BadRequestException('الأمر غير موجود');
    }

    if (command.status !== 'pending_approval') {
      throw new BadRequestException('الأمر ليس في انتظار الموافقة');
    }

    // التحقق من صلاحيات الموافق
    const requiredLevel = this.getRequiredApprovalLevel(command.commandType);
    const approverLevel = this.permissionLevels[approverRole] || 0;

    if (approverLevel < requiredLevel) {
      throw new ForbiddenException('ليس لديك صلاحية للموافقة على هذا الأمر');
    }

    // تحديث حالة الأمر
    const updatedCommand = await this.prisma.scadaCommand.update({
      where: { id: commandId },
      data: {
        status: 'pending',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // تسجيل الحدث
    await this.logEvent({
      type: 'COMMAND_APPROVED',
      entityType: 'command',
      entityId: commandId,
      description: `تمت الموافقة على الأمر بواسطة ${approvedBy}`,
      userId: approvedBy,
      metadata: { approverRole },
    });

    // تنفيذ الأمر تلقائياً بعد الموافقة
    return this.executeCommand(commandId);
  }

  /**
   * رفض أمر
   */
  async rejectCommand(
    commandId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<any> {
    const command = await this.prisma.scadaCommand.findUnique({
      where: { id: commandId },
    });

    if (!command) {
      throw new BadRequestException('الأمر غير موجود');
    }

    if (command.status !== 'pending_approval') {
      throw new BadRequestException('الأمر ليس في انتظار الموافقة');
    }

    const updatedCommand = await this.prisma.scadaCommand.update({
      where: { id: commandId },
      data: {
        status: 'rejected',
        response: JSON.stringify({ rejectedBy, rejectionReason: reason }),
      },
    });

    // تسجيل الحدث
    await this.logEvent({
      type: 'COMMAND_REJECTED',
      entityType: 'command',
      entityId: commandId,
      description: `تم رفض الأمر: ${reason}`,
      userId: rejectedBy,
      metadata: { reason },
    });

    return updatedCommand;
  }

  /**
   * تنفيذ أمر
   */
  async executeCommand(commandId: string): Promise<CommandExecutionResult> {
    const command = await this.prisma.scadaCommand.findUnique({
      where: { id: commandId },
      include: {
        device: {
          include: {
            station: true,
          },
        },
      },
    });

    if (!command) {
      return {
        success: false,
        commandId,
        message: 'الأمر غير موجود',
        error: 'COMMAND_NOT_FOUND',
      };
    }

    if (command.status !== 'pending') {
      return {
        success: false,
        commandId,
        message: 'الأمر ليس في حالة انتظار التنفيذ',
        error: 'INVALID_STATUS',
      };
    }

    // تحديث حالة الأمر إلى قيد التنفيذ
    await this.prisma.scadaCommand.update({
      where: { id: commandId },
      data: { status: 'executing' },
    });

    try {
      // تنفيذ الأمر عبر Modbus
      const result = await this.executeModbusCommand(command);

      if (result.success) {
        // تحديث حالة الأمر إلى مكتمل
        await this.prisma.scadaCommand.update({
          where: { id: commandId },
          data: {
            status: 'executed',
            executedAt: new Date(),
            response: JSON.stringify(result.response),
          },
        });

        // تسجيل الحدث
        await this.logEvent({
          type: 'COMMAND_EXECUTED',
          entityType: 'command',
          entityId: commandId,
          description: `تم تنفيذ الأمر ${command.commandType} بنجاح`,
          userId: command.requestedBy,
          metadata: { response: result.response },
        });

        // إرسال إشعار
        this.eventEmitter.emit('command.executed', {
          commandId,
          commandType: command.commandType,
          deviceCode: (command as any).device?.code || 'unknown',
          success: true,
        });

        return {
          success: true,
          commandId,
          message: 'تم تنفيذ الأمر بنجاح',
          executedAt: new Date(),
        };
      } else {
        throw new Error(result.error || 'فشل تنفيذ الأمر');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';

      // تحديث حالة الأمر إلى فاشل
      await this.prisma.scadaCommand.update({
        where: { id: commandId },
        data: {
          status: 'failed',
          response: JSON.stringify({ error: errorMessage }),
        },
      });

      // تسجيل الحدث
      await this.logEvent({
        type: 'COMMAND_FAILED',
        entityType: 'command',
        entityId: commandId,
        description: `فشل تنفيذ الأمر: ${errorMessage}`,
        userId: command.requestedBy,
        severity: 'error',
        metadata: { error: errorMessage },
      });

      return {
        success: false,
        commandId,
        message: 'فشل تنفيذ الأمر',
        error: errorMessage,
      };
    }
  }

  /**
   * تنفيذ أمر Modbus
   */
  private async executeModbusCommand(command: any): Promise<{
    success: boolean;
    response?: any;
    error?: string;
  }> {
    const { device, dataPoint, commandType, commandValue } = command;

    // التحقق من وجود اتصال
    if (!device.connection) {
      return {
        success: false,
        error: 'لا يوجد اتصال معرف للجهاز',
      };
    }

    try {
      // الاتصال بالجهاز
      const connectionId = `cmd-${command.id}`;
      await this.modbusClient.connect(connectionId, {
        protocol: device.connection.protocol || 'modbus_tcp',
        ipAddress: device.connection.host,
        port: device.connection.port,
        slaveId: device.connection.slaveId || 1,
        timeout: device.connection.timeout || 5000,
      });

      let result: any;

      // تنفيذ الأمر حسب النوع
      switch (commandType) {
        case 'WRITE_COIL':
        case 'OPEN_BREAKER':
        case 'CLOSE_BREAKER':
          // محاكاة كتابة coil
          result = { success: true, message: `Coil written at address ${dataPoint?.modbusAddress || 0}` };
          break;

        case 'WRITE_REGISTER':
        case 'CHANGE_SETPOINT':
          // محاكاة كتابة register
          result = { success: true, message: `Register written at address ${dataPoint?.modbusAddress || 0}` };
          break;

        default:
          return {
            success: false,
            error: `نوع الأمر غير مدعوم: ${commandType}`,
          };
      }

      await this.modbusClient.disconnect(connectionId);

      return {
        success: true,
        response: result,
      };
    } catch (error) {
      // تجاهل خطأ قطع الاتصال
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في الاتصال',
      };
    }
  }

  /**
   * الحصول على مستوى الموافقة المطلوب
   */
  private getRequiredApprovalLevel(commandType: string): number {
    const criticalCommands = ['EMERGENCY_STOP', 'RESET_PROTECTION'];
    const highCommands = ['OPEN_BREAKER', 'CLOSE_BREAKER', 'ENABLE_REMOTE', 'DISABLE_REMOTE'];

    if (criticalCommands.includes(commandType)) {
      return this.permissionLevels.admin;
    }
    if (highCommands.includes(commandType)) {
      return this.permissionLevels.engineer;
    }
    return this.permissionLevels.supervisor;
  }

  /**
   * الحصول على الأوامر المعلقة للموافقة
   */
  async getPendingApprovals(): Promise<any[]> {
    return this.prisma.scadaCommand.findMany({
      where: { status: 'pending_approval' },
      include: {
        device: {
          include: { station: true },
        },
      },
      orderBy: { requestedAt: 'asc' },
    });
  }

  /**
   * الحصول على سجل الأوامر
   */
  async getCommandHistory(filters: {
    deviceId?: string;
    stationId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.deviceId) {
      where.deviceId = filters.deviceId;
    }

    if (filters.stationId) {
      where.device = { stationId: filters.stationId };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.from || filters.to) {
      where.requestedAt = {};
      if (filters.from) where.requestedAt.gte = filters.from;
      if (filters.to) where.requestedAt.lte = filters.to;
    }

    return this.prisma.scadaCommand.findMany({
      where,
      include: {
        device: {
          include: { station: true },
        },
      },
      orderBy: { requestedAt: 'desc' },
      take: filters.limit || 100,
    });
  }

  /**
   * تسجيل حدث
   */
  private async logEvent(data: {
    type: string;
    entityType: string;
    entityId: string;
    description: string;
    userId?: string;
    severity?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.prisma.scadaEventLog.create({
        data: {
          eventType: data.type,
          entityType: data.entityType,
          entityId: data.entityId,
          description: data.description,
          userId: data.userId,
          details: {
            severity: data.severity || 'info',
            ...data.metadata,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to log event:', error);
    }
  }
}
