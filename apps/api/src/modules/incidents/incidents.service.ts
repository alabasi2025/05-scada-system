import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { stationId?: string; status?: string; severity?: string; skip?: number; take?: number }) {
    const { stationId, status, severity, skip = 0, take = 50 } = params;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [data, total] = await Promise.all([
      this.prisma.incidents.findMany({ where, skip, take, orderBy: { occurredAt: 'desc' } }),
      this.prisma.incidents.count({ where }),
    ]);
    return { data, total, skip, take };
  }

  async findOne(id: string) {
    return this.prisma.incidents.findUnique({ where: { id } });
  }

  async create(data: any) {
    const incidentNumber = `INC-${Date.now()}`;
    return this.prisma.incidents.create({ data: { ...data, incidentNumber } });
  }

  async update(id: string, data: any) {
    return this.prisma.incidents.update({ where: { id }, data });
  }

  async resolve(id: string, data: { resolvedBy: string; rootCause?: string; correctiveActions?: string }) {
    return this.prisma.incidents.update({
      where: { id },
      data: { ...data, status: 'resolved', resolvedAt: new Date() },
    });
  }
}
