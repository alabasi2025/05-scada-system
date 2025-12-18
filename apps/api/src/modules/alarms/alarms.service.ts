import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAlarmRuleDto, UpdateAlarmRuleDto, AlarmQueryDto, AcknowledgeAlarmDto, ClearAlarmDto } from './dto';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AlarmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== قواعد التنبيه ====================

  async createRule(createAlarmRuleDto: CreateAlarmRuleDto) {
    return this.prisma.scadaAlarmRule.create({
      data: {
        ...createAlarmRuleDto,
        threshold1: new Prisma.Decimal(createAlarmRuleDto.threshold1),
        threshold2: createAlarmRuleDto.threshold2 ? new Prisma.Decimal(createAlarmRuleDto.threshold2) : null,
      },
    });
  }

  async findAllRules() {
    return this.prisma.scadaAlarmRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { alarms: true },
        },
      },
    });
  }

  async findOneRule(id: string) {
    const rule = await this.prisma.scadaAlarmRule.findUnique({
      where: { id },
      include: {
        alarms: {
          take: 10,
          orderBy: { triggeredAt: 'desc' },
        },
      },
    });

    if (!rule) {
      throw new NotFoundException(`قاعدة التنبيه بالمعرف ${id} غير موجودة`);
    }

    return rule;
  }

  async updateRule(id: string, updateAlarmRuleDto: UpdateAlarmRuleDto) {
    await this.findOneRule(id);

    return this.prisma.scadaAlarmRule.update({
      where: { id },
      data: {
        ...updateAlarmRuleDto,
        threshold1: updateAlarmRuleDto.threshold1 !== undefined
          ? new Prisma.Decimal(updateAlarmRuleDto.threshold1)
          : undefined,
        threshold2: updateAlarmRuleDto.threshold2 !== undefined
          ? (updateAlarmRuleDto.threshold2 ? new Prisma.Decimal(updateAlarmRuleDto.threshold2) : null)
          : undefined,
      },
    });
  }

  async removeRule(id: string) {
    await this.findOneRule(id);
    return this.prisma.scadaAlarmRule.delete({ where: { id } });
  }

  // ==================== التنبيهات ====================

  async findAll(query: AlarmQueryDto) {
    const { page = 1, limit = 20, stationId, deviceId, status, severity, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaAlarmWhereInput = {};

    if (stationId) where.stationId = stationId;
    if (deviceId) where.deviceId = deviceId;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.triggeredAt = {};
      if (startDate) where.triggeredAt.gte = new Date(startDate);
      if (endDate) where.triggeredAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.scadaAlarm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { triggeredAt: 'desc' },
        include: {
          station: { select: { code: true, name: true } },
          device: { select: { code: true, name: true } },
          dataPoint: { select: { code: true, name: true, unit: true } },
        },
      }),
      this.prisma.scadaAlarm.count({ where }),
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

  async findActive() {
    return this.prisma.scadaAlarm.findMany({
      where: { status: 'active' },
      orderBy: [
        { severity: 'asc' }, // critical first
        { triggeredAt: 'desc' },
      ],
      include: {
        station: { select: { code: true, name: true } },
        device: { select: { code: true, name: true } },
        dataPoint: { select: { code: true, name: true, unit: true } },
      },
    });
  }

  async findOne(id: string) {
    const alarm = await this.prisma.scadaAlarm.findUnique({
      where: { id },
      include: {
        station: { select: { id: true, code: true, name: true } },
        device: { select: { id: true, code: true, name: true } },
        dataPoint: { select: { id: true, code: true, name: true, unit: true } },
        rule: true,
      },
    });

    if (!alarm) {
      throw new NotFoundException(`التنبيه بالمعرف ${id} غير موجود`);
    }

    return alarm;
  }

  async acknowledge(id: string, userId: string, dto: AcknowledgeAlarmDto) {
    const alarm = await this.findOne(id);

    if (alarm.status !== 'active') {
      throw new Error('لا يمكن الإقرار بتنبيه غير نشط');
    }

    const updatedAlarm = await this.prisma.scadaAlarm.update({
      where: { id },
      data: {
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        notes: dto.notes,
      },
      include: {
        station: { select: { code: true, name: true } },
        device: { select: { code: true, name: true } },
      },
    });

    this.eventEmitter.emit('alarm.acknowledged', updatedAlarm);

    return updatedAlarm;
  }

  async clear(id: string, dto: ClearAlarmDto) {
    const alarm = await this.findOne(id);

    if (alarm.status === 'cleared') {
      throw new Error('التنبيه تم إغلاقه مسبقاً');
    }

    const updatedAlarm = await this.prisma.scadaAlarm.update({
      where: { id },
      data: {
        status: 'cleared',
        clearedAt: new Date(),
        notes: dto.notes ? `${alarm.notes || ''}\n${dto.notes}` : alarm.notes,
      },
      include: {
        station: { select: { code: true, name: true } },
        device: { select: { code: true, name: true } },
      },
    });

    this.eventEmitter.emit('alarm.cleared', updatedAlarm);

    return updatedAlarm;
  }

  async getStatistics() {
    const [total, active, bySeverity, byStatus, recentAlarms] = await Promise.all([
      this.prisma.scadaAlarm.count(),
      this.prisma.scadaAlarm.count({ where: { status: 'active' } }),
      this.prisma.scadaAlarm.groupBy({
        by: ['severity'],
        _count: true,
        where: { status: 'active' },
      }),
      this.prisma.scadaAlarm.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.scadaAlarm.findMany({
        where: { status: 'active' },
        orderBy: { triggeredAt: 'desc' },
        take: 5,
        include: {
          station: { select: { code: true, name: true } },
        },
      }),
    ]);

    return {
      total,
      active,
      bySeverity: bySeverity.reduce((acc, item) => ({ ...acc, [item.severity]: item._count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      recentAlarms,
    };
  }

  async getAlarmsByStation(stationId: string) {
    return this.prisma.scadaAlarm.groupBy({
      by: ['severity', 'status'],
      where: { stationId },
      _count: true,
    });
  }
}
