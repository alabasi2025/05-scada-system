import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAlertDto, AlertQueryDto } from './dto';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAlertDto) { return this.prisma.alerts.create({ data: dto as any }); }

  async findAll(query: AlertQueryDto) {
    const { stationId, alertType, severity, status, page = 1, limit = 50 } = query;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.alerts.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { triggeredAt: 'desc' }, include: { station: true, point: true } }),
      this.prisma.alerts.count({ where })
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const alert = await this.prisma.alerts.findUnique({ where: { id }, include: { station: true, point: true } });
    if (!alert) throw new NotFoundException('التنبيه غير موجود');
    return alert;
  }

  async acknowledge(id: string, userId: string) {
    await this.findOne(id);
    return this.prisma.alerts.update({ where: { id }, data: { status: 'acknowledged', acknowledgedBy: userId, acknowledgedAt: new Date() } });
  }

  async resolve(id: string, userId: string, notes?: string) {
    await this.findOne(id);
    return this.prisma.alerts.update({ where: { id }, data: { status: 'resolved', resolvedBy: userId, resolvedAt: new Date(), resolutionNotes: notes } });
  }

  async getStats() {
    const [total, active, acknowledged, resolved, bySeverity] = await Promise.all([
      this.prisma.alerts.count(),
      this.prisma.alerts.count({ where: { status: 'active' } }),
      this.prisma.alerts.count({ where: { status: 'acknowledged' } }),
      this.prisma.alerts.count({ where: { status: 'resolved' } }),
      this.prisma.alerts.groupBy({ by: ['severity'], _count: { id: true } })
    ]);
    return { total, active, acknowledged, resolved, bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count.id })) };
  }
}
