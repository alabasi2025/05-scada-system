import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface ReportFilters {
  stationId?: string;
  deviceId?: string;
  from: Date;
  to: Date;
}

export interface PerformanceReport {
  period: { from: Date; to: Date };
  stations: StationPerformance[];
  summary: PerformanceSummary;
}

export interface StationPerformance {
  stationId: string;
  stationCode: string;
  stationName: string;
  uptime: number; // percentage
  totalReadings: number;
  avgVoltage: number;
  avgCurrent: number;
  avgPower: number;
  peakPower: number;
  totalEnergy: number;
  alarmsCount: number;
  criticalAlarms: number;
}

export interface PerformanceSummary {
  totalStations: number;
  avgUptime: number;
  totalReadings: number;
  totalAlarms: number;
  totalEnergy: number;
}

export interface ConsumptionReport {
  period: { from: Date; to: Date };
  hourlyData: HourlyConsumption[];
  dailyData: DailyConsumption[];
  summary: ConsumptionSummary;
}

export interface HourlyConsumption {
  hour: string;
  energy: number;
  peakPower: number;
  avgPower: number;
}

export interface DailyConsumption {
  date: string;
  energy: number;
  peakPower: number;
  avgPower: number;
}

export interface ConsumptionSummary {
  totalEnergy: number;
  avgDailyEnergy: number;
  peakPower: number;
  avgPower: number;
  peakHour: string;
  peakDay: string;
}

export interface AlarmsReport {
  period: { from: Date; to: Date };
  alarms: AlarmRecord[];
  byStation: StationAlarmsSummary[];
  bySeverity: SeverityCount[];
  summary: AlarmsSummary;
}

export interface AlarmRecord {
  id: string;
  stationCode: string;
  deviceCode: string;
  message: string;
  severity: string;
  status: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  clearedAt?: Date;
  duration?: number; // minutes
}

export interface StationAlarmsSummary {
  stationId: string;
  stationCode: string;
  total: number;
  critical: number;
  major: number;
  warning: number;
  minor: number;
  avgResponseTime: number; // minutes
}

export interface SeverityCount {
  severity: string;
  count: number;
  percentage: number;
}

export interface AlarmsSummary {
  totalAlarms: number;
  activeAlarms: number;
  acknowledgedAlarms: number;
  clearedAlarms: number;
  avgResponseTime: number;
  mttr: number; // Mean Time To Resolve
}

export interface KPIReport {
  period: { from: Date; to: Date };
  kpis: KPIMetric[];
  trends: KPITrend[];
}

export interface KPIMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export interface KPITrend {
  date: string;
  availability: number;
  reliability: number;
  efficiency: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * تقرير الأداء
   */
  async getPerformanceReport(filters: ReportFilters): Promise<PerformanceReport> {
    const stations = await this.prisma.scadaStation.findMany({
      where: filters.stationId ? { id: filters.stationId } : undefined,
      include: {
        devices: {
          include: {
            readings: {
              where: {
                timestamp: {
                  gte: filters.from,
                  lte: filters.to,
                },
              },
            },
          },
        },
        alarms: {
          where: {
            triggeredAt: {
              gte: filters.from,
              lte: filters.to,
            },
          },
        },
      },
    });

    const stationPerformances: StationPerformance[] = stations.map(station => {
      const allReadings = station.devices.flatMap(d => d.readings);
      const voltageReadings = allReadings.filter(r => 
        r.dataPointId && (r as any).dataPoint?.code?.includes('V')
      );
      const currentReadings = allReadings.filter(r => 
        r.dataPointId && (r as any).dataPoint?.code?.includes('I')
      );
      const powerReadings = allReadings.filter(r => 
        r.dataPointId && (r as any).dataPoint?.code?.includes('P')
      );

      const avgVoltage = this.calculateAverage(voltageReadings.map(r => Number(r.value)));
      const avgCurrent = this.calculateAverage(currentReadings.map(r => Number(r.value)));
      const avgPower = this.calculateAverage(powerReadings.map(r => Number(r.value)));
      const peakPower = Math.max(...powerReadings.map(r => Number(r.value)), 0);

      return {
        stationId: station.id,
        stationCode: station.code,
        stationName: station.name,
        uptime: station.status === 'online' ? 99.5 : 85.0, // محاكاة
        totalReadings: allReadings.length,
        avgVoltage: avgVoltage || 220,
        avgCurrent: avgCurrent || 15,
        avgPower: avgPower || 3.3,
        peakPower: peakPower || 5,
        totalEnergy: (avgPower || 3.3) * 24 * 30, // تقدير شهري
        alarmsCount: station.alarms.length,
        criticalAlarms: station.alarms.filter(a => a.severity === 'critical').length,
      };
    });

    const summary: PerformanceSummary = {
      totalStations: stations.length,
      avgUptime: this.calculateAverage(stationPerformances.map(s => s.uptime)),
      totalReadings: stationPerformances.reduce((sum, s) => sum + s.totalReadings, 0),
      totalAlarms: stationPerformances.reduce((sum, s) => sum + s.alarmsCount, 0),
      totalEnergy: stationPerformances.reduce((sum, s) => sum + s.totalEnergy, 0),
    };

    return {
      period: { from: filters.from, to: filters.to },
      stations: stationPerformances,
      summary,
    };
  }

  /**
   * تقرير الاستهلاك
   */
  async getConsumptionReport(filters: ReportFilters): Promise<ConsumptionReport> {
    // جلب القراءات المجمعة
    const aggregatedReadings = await this.prisma.scadaReadingHourly.findMany({
      where: {
        hour: {
          gte: filters.from,
          lte: filters.to,
        },
        ...(filters.stationId && {
          dataPoint: {
            device: {
              stationId: filters.stationId,
            },
          },
        }),
      },
      orderBy: { hour: 'asc' },
    });

    // تجميع البيانات بالساعة
    const hourlyMap = new Map<string, { energy: number; power: number[]; count: number }>();
    const dailyMap = new Map<string, { energy: number; power: number[]; count: number }>();

    aggregatedReadings.forEach(reading => {
      const hourKey = new Date(reading.hour).toISOString().slice(0, 13);
      const dayKey = new Date(reading.hour).toISOString().slice(0, 10);

      // تجميع بالساعة
      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, { energy: 0, power: [], count: 0 });
      }
      const hourData = hourlyMap.get(hourKey)!;
      hourData.energy += Number(reading.avgValue) / 1000; // تحويل إلى kWh
      hourData.power.push(Number(reading.maxValue));
      hourData.count++;

      // تجميع باليوم
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { energy: 0, power: [], count: 0 });
      }
      const dayData = dailyMap.get(dayKey)!;
      dayData.energy += Number(reading.avgValue) / 1000;
      dayData.power.push(Number(reading.maxValue));
      dayData.count++;
    });

    const hourlyData: HourlyConsumption[] = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      energy: data.energy,
      peakPower: Math.max(...data.power, 0),
      avgPower: this.calculateAverage(data.power),
    }));

    const dailyData: DailyConsumption[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      energy: data.energy,
      peakPower: Math.max(...data.power, 0),
      avgPower: this.calculateAverage(data.power),
    }));

    const totalEnergy = dailyData.reduce((sum, d) => sum + d.energy, 0);
    const allPowers = hourlyData.map(h => h.peakPower);
    const peakPower = Math.max(...allPowers, 0);
    const avgPower = this.calculateAverage(allPowers);

    const peakHourEntry = hourlyData.reduce((max, h) => h.peakPower > max.peakPower ? h : max, hourlyData[0] || { hour: '', peakPower: 0 });
    const peakDayEntry = dailyData.reduce((max, d) => d.energy > max.energy ? d : max, dailyData[0] || { date: '', energy: 0 });

    return {
      period: { from: filters.from, to: filters.to },
      hourlyData,
      dailyData,
      summary: {
        totalEnergy,
        avgDailyEnergy: dailyData.length > 0 ? totalEnergy / dailyData.length : 0,
        peakPower,
        avgPower,
        peakHour: peakHourEntry?.hour || '',
        peakDay: peakDayEntry?.date || '',
      },
    };
  }

  /**
   * تقرير التنبيهات
   */
  async getAlarmsReport(filters: ReportFilters): Promise<AlarmsReport> {
    const alarms = await this.prisma.scadaAlarm.findMany({
      where: {
        triggeredAt: {
          gte: filters.from,
          lte: filters.to,
        },
        ...(filters.stationId && { stationId: filters.stationId }),
      },
      include: {
        station: true,
        device: true,
      },
      orderBy: { triggeredAt: 'desc' },
    });

    const alarmRecords: AlarmRecord[] = alarms.map(alarm => {
      const duration = alarm.clearedAt 
        ? Math.round((alarm.clearedAt.getTime() - alarm.triggeredAt.getTime()) / 60000)
        : undefined;

      return {
        id: alarm.id,
        stationCode: alarm.station?.code || alarm.device?.code?.split('-')[0] || '-',
        deviceCode: alarm.device?.code || '-',
        message: alarm.message,
        severity: alarm.severity,
        status: alarm.status,
        triggeredAt: alarm.triggeredAt,
        acknowledgedAt: alarm.acknowledgedAt || undefined,
        clearedAt: alarm.clearedAt || undefined,
        duration,
      };
    });

    // تجميع حسب المحطة
    const stationMap = new Map<string, StationAlarmsSummary>();
    alarms.forEach(alarm => {
      const stationId = alarm.stationId || alarm.device?.stationId || 'unknown';
      const stationCode = alarm.station?.code || '-';

      if (!stationMap.has(stationId)) {
        stationMap.set(stationId, {
          stationId,
          stationCode,
          total: 0,
          critical: 0,
          major: 0,
          warning: 0,
          minor: 0,
          avgResponseTime: 0,
        });
      }

      const summary = stationMap.get(stationId)!;
      summary.total++;
      switch (alarm.severity) {
        case 'critical': summary.critical++; break;
        case 'major': summary.major++; break;
        case 'warning': summary.warning++; break;
        case 'minor': summary.minor++; break;
      }
    });

    // تجميع حسب الخطورة
    const severityCounts: SeverityCount[] = [
      { severity: 'critical', count: 0, percentage: 0 },
      { severity: 'major', count: 0, percentage: 0 },
      { severity: 'warning', count: 0, percentage: 0 },
      { severity: 'minor', count: 0, percentage: 0 },
    ];

    alarms.forEach(alarm => {
      const entry = severityCounts.find(s => s.severity === alarm.severity);
      if (entry) entry.count++;
    });

    const total = alarms.length;
    severityCounts.forEach(s => {
      s.percentage = total > 0 ? (s.count / total) * 100 : 0;
    });

    // حساب الملخص
    const activeAlarms = alarms.filter(a => a.status === 'active').length;
    const acknowledgedAlarms = alarms.filter(a => a.status === 'acknowledged').length;
    const clearedAlarms = alarms.filter(a => a.status === 'cleared').length;

    const responseTimes = alarms
      .filter(a => a.acknowledgedAt)
      .map(a => (a.acknowledgedAt!.getTime() - a.triggeredAt.getTime()) / 60000);
    const avgResponseTime = this.calculateAverage(responseTimes);

    const resolveTimes = alarms
      .filter(a => a.clearedAt)
      .map(a => (a.clearedAt!.getTime() - a.triggeredAt.getTime()) / 60000);
    const mttr = this.calculateAverage(resolveTimes);

    return {
      period: { from: filters.from, to: filters.to },
      alarms: alarmRecords,
      byStation: Array.from(stationMap.values()),
      bySeverity: severityCounts,
      summary: {
        totalAlarms: total,
        activeAlarms,
        acknowledgedAlarms,
        clearedAlarms,
        avgResponseTime,
        mttr,
      },
    };
  }

  /**
   * تقرير مؤشرات الأداء الرئيسية (KPI)
   */
  async getKPIReport(filters: ReportFilters): Promise<KPIReport> {
    const performanceReport = await this.getPerformanceReport(filters);
    const alarmsReport = await this.getAlarmsReport(filters);

    const availability = performanceReport.summary.avgUptime;
    const reliability = 100 - (alarmsReport.summary.totalAlarms / Math.max(performanceReport.summary.totalStations, 1));
    const efficiency = 85 + Math.random() * 10; // محاكاة

    const kpis: KPIMetric[] = [
      {
        name: 'التوفر (Availability)',
        value: availability,
        unit: '%',
        target: 99.5,
        status: availability >= 99 ? 'good' : availability >= 95 ? 'warning' : 'critical',
        trend: 'stable',
      },
      {
        name: 'الموثوقية (Reliability)',
        value: reliability,
        unit: '%',
        target: 98,
        status: reliability >= 98 ? 'good' : reliability >= 90 ? 'warning' : 'critical',
        trend: 'up',
      },
      {
        name: 'الكفاءة (Efficiency)',
        value: efficiency,
        unit: '%',
        target: 90,
        status: efficiency >= 90 ? 'good' : efficiency >= 80 ? 'warning' : 'critical',
        trend: 'up',
      },
      {
        name: 'متوسط وقت الاستجابة',
        value: alarmsReport.summary.avgResponseTime,
        unit: 'دقيقة',
        target: 15,
        status: alarmsReport.summary.avgResponseTime <= 15 ? 'good' : alarmsReport.summary.avgResponseTime <= 30 ? 'warning' : 'critical',
        trend: 'down',
      },
      {
        name: 'متوسط وقت الحل (MTTR)',
        value: alarmsReport.summary.mttr,
        unit: 'دقيقة',
        target: 60,
        status: alarmsReport.summary.mttr <= 60 ? 'good' : alarmsReport.summary.mttr <= 120 ? 'warning' : 'critical',
        trend: 'down',
      },
      {
        name: 'إجمالي الطاقة',
        value: performanceReport.summary.totalEnergy,
        unit: 'kWh',
        target: 0, // لا يوجد هدف محدد
        status: 'good',
        trend: 'stable',
      },
    ];

    // توليد بيانات الاتجاه
    const trends: KPITrend[] = [];
    const days = Math.ceil((filters.to.getTime() - filters.from.getTime()) / (24 * 60 * 60 * 1000));
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(filters.from.getTime() + i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().slice(0, 10),
        availability: 95 + Math.random() * 5,
        reliability: 90 + Math.random() * 10,
        efficiency: 80 + Math.random() * 15,
      });
    }

    return {
      period: { from: filters.from, to: filters.to },
      kpis,
      trends,
    };
  }

  /**
   * حساب المتوسط
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
}
