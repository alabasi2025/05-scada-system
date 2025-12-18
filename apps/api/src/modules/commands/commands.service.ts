import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCommandDto, ApproveCommandDto, RejectCommandDto, CommandQueryDto } from './dto';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createCommandDto: CreateCommandDto, requestedBy: string) {
    // التحقق من وجود الجهاز
    const device = await this.prisma.scadaDevice.findUnique({
      where: { id: createCommandDto.deviceId },
      include: {
        station: { select: { id: true, code: true, name: true } },
      },
    });

    if (!device) {
      throw new NotFoundException(`الجهاز بالمعرف ${createCommandDto.deviceId} غير موجود`);
    }

    // التحقق من حالة الجهاز
    if (device.status === 'inactive' || device.status === 'faulty') {
      throw new BadRequestException(`لا يمكن إرسال أوامر لجهاز ${device.status === 'inactive' ? 'غير نشط' : 'معطل'}`);
    }

    // إنشاء رقم الأمر
    const commandNo = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const command = await this.prisma.scadaCommand.create({
      data: {
        commandNo,
        deviceId: createCommandDto.deviceId,
        commandType: createCommandDto.commandType,
        targetValue: createCommandDto.targetValue,
        reason: createCommandDto.reason,
        requestedBy,
      },
      include: {
        device: {
          select: {
            code: true,
            name: true,
            station: { select: { code: true, name: true } },
          },
        },
      },
    });

    // إرسال حدث إنشاء الأمر
    this.eventEmitter.emit('command.created', command);

    // تسجيل الحدث
    await this.logEvent('COMMAND_CREATED', command);

    return command;
  }

  async findAll(query: CommandQueryDto) {
    const { page = 1, limit = 20, deviceId, status, commandType, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaCommandWhereInput = {};

    if (deviceId) where.deviceId = deviceId;
    if (status) where.status = status;
    if (commandType) where.commandType = commandType;
    if (startDate || endDate) {
      where.requestedAt = {};
      if (startDate) where.requestedAt.gte = new Date(startDate);
      if (endDate) where.requestedAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.scadaCommand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          device: {
            select: {
              code: true,
              name: true,
              station: { select: { code: true, name: true } },
            },
          },
        },
      }),
      this.prisma.scadaCommand.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const command = await this.prisma.scadaCommand.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            status: true,
            station: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    if (!command) {
      throw new NotFoundException(`الأمر بالمعرف ${id} غير موجود`);
    }

    return command;
  }

  async approve(id: string, approvedBy: string, dto: ApproveCommandDto) {
    const command = await this.findOne(id);

    if (command.status !== 'pending') {
      throw new BadRequestException('لا يمكن الموافقة على أمر غير معلق');
    }

    const updatedCommand = await this.prisma.scadaCommand.update({
      where: { id },
      data: {
        status: 'sent',
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        device: {
          select: {
            code: true,
            name: true,
            station: { select: { code: true, name: true } },
          },
        },
      },
    });

    // إرسال حدث الموافقة
    this.eventEmitter.emit('command.approved', updatedCommand);

    // محاكاة تنفيذ الأمر (في الإنتاج، سيتم إرساله للجهاز الفعلي)
    await this.executeCommand(id);

    return updatedCommand;
  }

  async reject(id: string, dto: RejectCommandDto) {
    const command = await this.findOne(id);

    if (command.status !== 'pending') {
      throw new BadRequestException('لا يمكن رفض أمر غير معلق');
    }

    const updatedCommand = await this.prisma.scadaCommand.update({
      where: { id },
      data: {
        status: 'rejected',
        response: dto.reason,
      },
      include: {
        device: {
          select: {
            code: true,
            name: true,
            station: { select: { code: true, name: true } },
          },
        },
      },
    });

    // إرسال حدث الرفض
    this.eventEmitter.emit('command.rejected', updatedCommand);

    return updatedCommand;
  }

  async executeCommand(id: string) {
    const command = await this.findOne(id);

    if (command.status !== 'sent') {
      throw new BadRequestException('لا يمكن تنفيذ أمر غير مرسل');
    }

    try {
      // محاكاة تنفيذ الأمر
      // في الإنتاج، سيتم الاتصال بالجهاز عبر Modbus أو بروتوكول آخر
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedCommand = await this.prisma.scadaCommand.update({
        where: { id },
        data: {
          status: 'executed',
          executedAt: new Date(),
          response: 'تم تنفيذ الأمر بنجاح',
        },
      });

      // إرسال حدث التنفيذ
      this.eventEmitter.emit('command.executed', updatedCommand);

      // تسجيل الحدث
      await this.logEvent('COMMAND_EXECUTED', updatedCommand);

      return updatedCommand;
    } catch (error) {
      const updatedCommand = await this.prisma.scadaCommand.update({
        where: { id },
        data: {
          status: 'failed',
          response: error.message,
        },
      });

      // إرسال حدث الفشل
      this.eventEmitter.emit('command.failed', updatedCommand);

      return updatedCommand;
    }
  }

  async getPendingCommands() {
    return this.prisma.scadaCommand.findMany({
      where: { status: 'pending' },
      orderBy: { requestedAt: 'asc' },
      include: {
        device: {
          select: {
            code: true,
            name: true,
            station: { select: { code: true, name: true } },
          },
        },
      },
    });
  }

  async getStatistics() {
    const [total, byStatus, byType, recent] = await Promise.all([
      this.prisma.scadaCommand.count(),
      this.prisma.scadaCommand.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.scadaCommand.groupBy({
        by: ['commandType'],
        _count: true,
      }),
      this.prisma.scadaCommand.findMany({
        orderBy: { requestedAt: 'desc' },
        take: 5,
        include: {
          device: { select: { code: true, name: true } },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      byType: byType.reduce((acc, item) => ({ ...acc, [item.commandType]: item._count }), {}),
      recent,
    };
  }

  private async logEvent(eventType: string, command: any) {
    await this.prisma.scadaEventLog.create({
      data: {
        eventType,
        entityType: 'command',
        entityId: command.id,
        description: `${eventType}: ${command.commandNo} - ${command.commandType}`,
        details: command,
        userId: command.requestedBy,
      },
    });
  }
}
