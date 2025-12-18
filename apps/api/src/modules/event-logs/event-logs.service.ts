import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEventLogDto, EventLogQueryDto, EventType, EntityType } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventLogsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEventLogDto) {
    return this.prisma.scadaEventLog.create({
      data: {
        eventType: dto.eventType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        description: dto.description,
        details: dto.details as Prisma.JsonObject,
        userId: dto.userId,
        ipAddress: dto.ipAddress,
      },
    });
  }

  async findAll(query: EventLogQueryDto) {
    const { eventType, entityType, entityId, userId, startDate, endDate, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaEventLogWhereInput = {};

    if (eventType) where.eventType = eventType;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.scadaEventLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.scadaEventLog.count({ where }),
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

  async findByEntity(entityType: EntityType, entityId: string, limit = 20) {
    return this.prisma.scadaEventLog.findMany({
      where: { entityType, entityId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatistics(startDate?: string, endDate?: string) {
    const where: Prisma.ScadaEventLogWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, byEventType, byEntityType] = await Promise.all([
      this.prisma.scadaEventLog.count({ where }),
      this.prisma.scadaEventLog.groupBy({
        by: ['eventType'],
        where,
        _count: { id: true },
      }),
      this.prisma.scadaEventLog.groupBy({
        by: ['entityType'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      total,
      byEventType: byEventType.reduce((acc, item) => {
        acc[item.eventType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byEntityType: byEntityType.reduce((acc, item) => {
        acc[item.entityType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Helper methods for logging specific events
  async logReading(deviceId: string, description: string, details?: Record<string, any>) {
    return this.create({
      eventType: EventType.READING,
      entityType: EntityType.DEVICE,
      entityId: deviceId,
      description,
      details,
    });
  }

  async logAlarm(alarmId: string, description: string, details?: Record<string, any>) {
    return this.create({
      eventType: EventType.ALARM,
      entityType: EntityType.ALARM,
      entityId: alarmId,
      description,
      details,
    });
  }

  async logCommand(commandId: string, description: string, userId?: string, details?: Record<string, any>) {
    return this.create({
      eventType: EventType.COMMAND,
      entityType: EntityType.COMMAND,
      entityId: commandId,
      description,
      userId,
      details,
    });
  }

  async logConnection(stationId: string, description: string, details?: Record<string, any>) {
    return this.create({
      eventType: EventType.CONNECTION,
      entityType: EntityType.CONNECTION,
      entityId: stationId,
      description,
      details,
    });
  }

  async logSystem(description: string, details?: Record<string, any>) {
    return this.create({
      eventType: EventType.SYSTEM,
      entityType: EntityType.STATION,
      description,
      details,
    });
  }

  async cleanOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.scadaEventLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return {
      deleted: result.count,
      message: `تم حذف ${result.count} سجل أقدم من ${daysToKeep} يوم`,
    };
  }
}
