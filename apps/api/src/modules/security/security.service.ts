import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  /**
   * الحصول على قائمة الكاميرات
   */
  async getCameras(stationId?: string, status?: string) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;

    return this.prisma.cameras.findMany({
      where,
      include: { station: { select: { name: true, code: true } } },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * الحصول على سجل الدخول
   */
  async getAccessLogs(accessPointId?: string, startDate?: string, endDate?: string, page = 1, limit = 20) {
    const where: any = {};
    if (accessPointId) where.accessPointId = accessPointId;
    if (startDate || endDate) {
      where.accessTime = {};
      if (startDate) where.accessTime.gte = new Date(startDate);
      if (endDate) where.accessTime.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.access_log.findMany({
        where,
        orderBy: { accessTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { accessPoint: { select: { name: true, pointType: true } } }
      }),
      this.prisma.access_log.count({ where })
    ]);

    return {
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * تسجيل دخول جديد
   */
  async createAccessLog(data: any) {
    return this.prisma.access_log.create({
      data: {
        ...data,
        accessTime: new Date(),
      }
    });
  }

  /**
   * الحصول على أحداث الأمان
   */
  async getSecurityEvents(stationId?: string, eventType?: string, page = 1, limit = 20) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (eventType) where.eventType = eventType;

    const [events, total] = await Promise.all([
      this.prisma.security_events.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { station: { select: { name: true, code: true } } }
      }),
      this.prisma.security_events.count({ where })
    ]);

    return {
      data: events,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * تسجيل حدث أمان جديد
   */
  async createSecurityEvent(data: any) {
    return this.prisma.security_events.create({
      data: {
        eventCode: `SEC-${Date.now()}`,
        ...data,
        occurredAt: new Date(),
      }
    });
  }

  /**
   * إحصائيات الأمان للوحة التحكم
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCameras, onlineCameras, todayAccessLogs, unresolvedEvents] = await Promise.all([
      this.prisma.cameras.count(),
      this.prisma.cameras.count({ where: { status: 'online' } }),
      this.prisma.access_log.count({ where: { accessTime: { gte: today } } }),
      this.prisma.security_events.count({ where: { status: { not: 'resolved' } } })
    ]);

    return {
      totalCameras,
      onlineCameras,
      offlineCameras: totalCameras - onlineCameras,
      todayAccessLogs,
      unresolvedEvents,
    };
  }
}
