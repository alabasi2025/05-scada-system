import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class QualityService {
  constructor(private prisma: PrismaService) {}

  async getQualityMetrics(stationId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (startDate || endDate) {
      where.metricDate = {};
      if (startDate) where.metricDate.gte = new Date(startDate);
      if (endDate) where.metricDate.lte = new Date(endDate);
    }

    const metrics = await this.prisma.quality_metrics.findMany({
      where,
      orderBy: { metricDate: 'desc' },
      take: 100,
      include: { station: { select: { name: true, code: true } } }
    });

    return { data: metrics, averages: {} };
  }

  async getReliabilityMetrics(stationId?: string, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    
    const where: any = {
      periodStart: { gte: startOfYear },
      periodEnd: { lte: endOfYear }
    };
    if (stationId) where.stationId = stationId;

    const metrics = await this.prisma.reliability_metrics.findMany({
      where,
      orderBy: [{ periodStart: 'desc' }],
      include: { station: { select: { name: true, code: true } } }
    });

    return { data: metrics, yearlyTotals: {} };
  }

  async getIncidents(stationId?: string, status?: string, page = 1, limit = 10) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;

    const [incidentsList, total] = await Promise.all([
      this.prisma.incidents.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { station: { select: { name: true, code: true } } }
      }),
      this.prisma.incidents.count({ where })
    ]);

    return {
      data: incidentsList,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async createIncident(data: any) {
    return this.prisma.incidents.create({
      data: {
        incidentCode: `INC-${Date.now()}`,
        ...data,
        occurredAt: new Date(),
        status: 'open',
      }
    });
  }

  async getInspections(stationId?: string, status?: string, page = 1, limit = 10) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;

    const [inspections, total] = await Promise.all([
      this.prisma.safety_inspections.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { station: { select: { name: true, code: true } } }
      }),
      this.prisma.safety_inspections.count({ where })
    ]);

    return {
      data: inspections,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getDashboardStats() {
    const [qualityCount, incidentsOpen, inspectionsPending] = await Promise.all([
      this.prisma.quality_metrics.count(),
      this.prisma.incidents.count({ where: { status: 'open' } }),
      this.prisma.safety_inspections.count({ where: { status: 'scheduled' } }),
    ]);

    return {
      qualityRecords: qualityCount,
      openIncidents: incidentsOpen,
      pendingInspections: inspectionsPending,
    };
  }
}
