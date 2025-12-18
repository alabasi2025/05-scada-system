import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EnergyService {
  constructor(private prisma: PrismaService) {}

  async getSummary(stationId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (startDate || endDate) {
      where.summaryDate = {};
      if (startDate) where.summaryDate.gte = new Date(startDate);
      if (endDate) where.summaryDate.lte = new Date(endDate);
    }
    return this.prisma.energy_summary.findMany({ where, orderBy: { summaryDate: 'desc' }, take: 100 });
  }

  async getConsumptionAnalysis(stationId: string) {
    const summary = await this.prisma.energy_summary.findMany({ where: { stationId }, orderBy: { summaryDate: 'desc' }, take: 30 });
    const total = summary.reduce((acc, s) => acc + (s.totalConsumption?.toNumber() || 0), 0);
    const avg = total / (summary.length || 1);
    return { stationId, totalConsumption: total, avgConsumption: avg, records: summary };
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalStations, totalEnergy, activeAlerts] = await Promise.all([
      this.prisma.scada_stations.count(),
      this.prisma.energy_summary.aggregate({ _sum: { totalConsumption: true }, where: { summaryDate: { gte: today } } }),
      this.prisma.alerts.count({ where: { status: 'active' } })
    ]);
    return { totalStations, todayEnergy: totalEnergy._sum.totalConsumption || 0, activeAlerts };
  }
}
