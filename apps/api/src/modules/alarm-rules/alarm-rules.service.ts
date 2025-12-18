import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAlarmRuleDto, UpdateAlarmRuleDto, AlarmRuleQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AlarmRulesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAlarmRuleDto) {
    return this.prisma.scadaAlarmRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        dataPointId: dto.dataPointId,
        deviceId: dto.deviceId,
        stationId: dto.stationId,
        condition: dto.condition,
        threshold1: dto.threshold1,
        threshold2: dto.threshold2,
        severity: dto.severity,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(query: AlarmRuleQueryDto) {
    const { dataPointId, deviceId, stationId, severity, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaAlarmRuleWhereInput = {};

    if (dataPointId) where.dataPointId = dataPointId;
    if (deviceId) where.deviceId = deviceId;
    if (stationId) where.stationId = stationId;
    if (severity) where.severity = severity;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.scadaAlarmRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.scadaAlarmRule.count({ where }),
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
      throw new NotFoundException(`قاعدة التنبيه غير موجودة: ${id}`);
    }

    return rule;
  }

  async update(id: string, dto: UpdateAlarmRuleDto) {
    await this.findOne(id);

    return this.prisma.scadaAlarmRule.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        dataPointId: dto.dataPointId,
        deviceId: dto.deviceId,
        stationId: dto.stationId,
        condition: dto.condition,
        threshold1: dto.threshold1,
        threshold2: dto.threshold2,
        severity: dto.severity,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.scadaAlarmRule.delete({
      where: { id },
    });
  }

  async getActiveRules() {
    return this.prisma.scadaAlarmRule.findMany({
      where: { isActive: true },
    });
  }

  async getRulesForDataPoint(dataPointId: string) {
    return this.prisma.scadaAlarmRule.findMany({
      where: {
        OR: [
          { dataPointId },
          { dataPointId: null }, // قواعد عامة
        ],
        isActive: true,
      },
    });
  }

  async toggleActive(id: string) {
    const rule = await this.findOne(id);

    return this.prisma.scadaAlarmRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
  }

  async getStatistics() {
    const [total, active, bySeverity] = await Promise.all([
      this.prisma.scadaAlarmRule.count(),
      this.prisma.scadaAlarmRule.count({ where: { isActive: true } }),
      this.prisma.scadaAlarmRule.groupBy({
        by: ['severity'],
        _count: { id: true },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
