import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EnergyService {
  constructor(private prisma: PrismaService) {}

  /**
   * الحصول على ملخص الطاقة
   */
  async getSummary(stationId?: string, startDate?: string, endDate?: string, period?: string) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (period) where.summaryType = period;
    if (startDate || endDate) {
      where.summaryDate = {};
      if (startDate) where.summaryDate.gte = new Date(startDate);
      if (endDate) where.summaryDate.lte = new Date(endDate);
    }

    const summaries = await this.prisma.energy_summary.findMany({
      where,
      orderBy: { summaryDate: 'desc' },
      take: 100,
      include: { station: { select: { name: true, code: true } } }
    });

    const totals = await this.prisma.energy_summary.aggregate({
      where,
      _sum: {
        totalConsumption: true,
        peakDemand: true,
        totalGeneration: true,
        gridLosses: true,
      },
      _avg: {
        powerFactor: true,
      }
    });

    return {
      data: summaries,
      totals: {
        totalConsumption: totals._sum.totalConsumption || 0,
        peakDemand: totals._sum.peakDemand || 0,
        totalGeneration: totals._sum.totalGeneration || 0,
        gridLosses: totals._sum.gridLosses || 0,
        avgPowerFactor: totals._avg.powerFactor || 0,
      }
    };
  }

  /**
   * تحليل الاستهلاك حسب القطاع/المحطة
   */
  async getConsumptionAnalysis(stationId?: string, period: string = 'daily') {
    const where: any = { summaryType: period };
    if (stationId) where.stationId = stationId;

    const summary = await this.prisma.energy_summary.findMany({
      where,
      orderBy: { summaryDate: 'desc' },
      take: 30,
      include: { station: { select: { name: true, code: true, type: true } } }
    });

    // تجميع حسب نوع المحطة
    const byStationType: Record<string, number> = {};
    summary.forEach(s => {
      const type = s.station?.type || 'unknown';
      byStationType[type] = (byStationType[type] || 0) + (s.totalConsumption?.toNumber() || 0);
    });

    const total = summary.reduce((acc, s) => acc + (s.totalConsumption?.toNumber() || 0), 0);
    const avg = total / (summary.length || 1);
    const peak = Math.max(...summary.map(s => s.peakDemand?.toNumber() || 0));

    return {
      stationId,
      period,
      totalConsumption: total,
      avgConsumption: avg,
      peakDemand: peak,
      byStationType,
      records: summary,
    };
  }

  /**
   * توقعات الطلب على الطاقة
   */
  async getForecast(stationId?: string, days: number = 7) {
    // جلب البيانات التاريخية
    const historicalData = await this.prisma.energy_summary.findMany({
      where: stationId ? { stationId } : {},
      orderBy: { summaryDate: 'desc' },
      take: 30,
    });

    // حساب المتوسط والاتجاه البسيط
    const values = historicalData.map(d => d.totalConsumption?.toNumber() || 0);
    const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    
    // حساب الاتجاه (trend) البسيط
    const trend = values.length > 1 
      ? (values[0] - values[values.length - 1]) / values.length 
      : 0;

    // إنشاء التوقعات
    const forecast = [];
    const today = new Date();
    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedConsumption: Math.max(0, avg + (trend * i)),
        confidence: Math.max(0.5, 0.95 - (i * 0.05)), // تقل الثقة مع البعد
      });
    }

    return {
      stationId,
      historicalAvg: avg,
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      forecast,
    };
  }

  /**
   * تحليل الفقد في الشبكة
   */
  async getLosses(stationId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (startDate || endDate) {
      where.summaryDate = {};
      if (startDate) where.summaryDate.gte = new Date(startDate);
      if (endDate) where.summaryDate.lte = new Date(endDate);
    }

    const summaries = await this.prisma.energy_summary.findMany({
      where,
      include: { station: { select: { name: true, code: true } } }
    });

    // حساب الفقد لكل محطة
    const lossesByStation = summaries.reduce((acc: any[], s) => {
      const generation = s.totalGeneration?.toNumber() || 0;
      const consumption = s.totalConsumption?.toNumber() || 0;
      const losses = s.gridLosses?.toNumber() || 0;
      
      const totalInput = generation;
      const totalOutput = consumption + losses;
      const loss = totalInput - totalOutput;
      const lossPercentage = totalInput > 0 ? (loss / totalInput) * 100 : 0;

      acc.push({
        stationId: s.stationId,
        stationName: s.station?.name,
        date: s.summaryDate,
        totalInput,
        totalOutput,
        loss,
        lossPercentage: Math.round(lossPercentage * 100) / 100,
      });
      return acc;
    }, []);

    // إجمالي الفقد
    const totalInput = lossesByStation.reduce((a, b) => a + b.totalInput, 0);
    const totalOutput = lossesByStation.reduce((a, b) => a + b.totalOutput, 0);
    const totalLoss = totalInput - totalOutput;
    const avgLossPercentage = totalInput > 0 ? (totalLoss / totalInput) * 100 : 0;

    return {
      summary: {
        totalInput,
        totalOutput,
        totalLoss,
        avgLossPercentage: Math.round(avgLossPercentage * 100) / 100,
      },
      byStation: lossesByStation,
    };
  }

  /**
   * إحصائيات لوحة التحكم
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [totalStations, todayEnergy, yesterdayEnergy, activeAlerts, criticalAlerts] = await Promise.all([
      this.prisma.scada_stations.count({ where: { isActive: true } }),
      this.prisma.energy_summary.aggregate({
        _sum: { totalConsumption: true },
        where: { summaryDate: { gte: today } }
      }),
      this.prisma.energy_summary.aggregate({
        _sum: { totalConsumption: true },
        where: { summaryDate: { gte: yesterday, lt: today } }
      }),
      this.prisma.alerts.count({ where: { status: 'active' } }),
      this.prisma.alerts.count({ where: { status: 'active', severity: 'critical' } }),
    ]);

    const todayTotal = todayEnergy._sum.totalConsumption?.toNumber() || 0;
    const yesterdayTotal = yesterdayEnergy._sum.totalConsumption?.toNumber() || 0;
    const changePercent = yesterdayTotal > 0 
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 
      : 0;

    return {
      totalStations,
      todayEnergy: todayTotal,
      yesterdayEnergy: yesterdayTotal,
      energyChangePercent: Math.round(changePercent * 100) / 100,
      activeAlerts,
      criticalAlerts,
    };
  }
}
