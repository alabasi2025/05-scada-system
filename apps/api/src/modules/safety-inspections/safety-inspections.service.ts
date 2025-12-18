import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SafetyInspectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { stationId?: string; status?: string; skip?: number; take?: number }) {
    const { stationId, status, skip = 0, take = 50 } = params;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.safety_inspections.findMany({ where, skip, take, orderBy: { scheduledDate: 'desc' }, include: { station: true } }),
      this.prisma.safety_inspections.count({ where }),
    ]);
    return { data, total, skip, take };
  }

  async findOne(id: string) {
    return this.prisma.safety_inspections.findUnique({ where: { id }, include: { station: true } });
  }

  async create(data: any) {
    const inspectionNumber = `INS-${Date.now()}`;
    return this.prisma.safety_inspections.create({ data: { ...data, inspectionNumber } });
  }

  async update(id: string, data: any) {
    return this.prisma.safety_inspections.update({ where: { id }, data });
  }

  async complete(id: string, data: { inspectorId?: string; overallResult?: string; report?: string }) {
    return this.prisma.safety_inspections.update({
      where: { id },
      data: { ...data, status: 'completed', performedDate: new Date() },
    });
  }
}
