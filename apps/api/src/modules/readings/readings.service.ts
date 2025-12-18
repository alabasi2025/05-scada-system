import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReadingDto, ReadingQueryDto } from './dto';

@Injectable()
export class ReadingsService {
  constructor(private prisma: PrismaService) {}

  async createLive(dto: CreateReadingDto) {
    return this.prisma.live_readings.create({ data: { pointId: dto.pointId, value: dto.value, quality: dto.quality || 'good' } });
  }

  async getLive(query: ReadingQueryDto) {
    const { pointId, page = 1, limit = 100 } = query;
    const where: any = {};
    if (pointId) where.pointId = pointId;
    return this.prisma.live_readings.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { readingTime: 'desc' }, include: { point: true } });
  }

  async getHistory(query: ReadingQueryDto) {
    const { pointId, startDate, endDate, page = 1, limit = 1000 } = query;
    const where: any = {};
    if (pointId) where.pointId = pointId;
    if (startDate || endDate) {
      where.readingTime = {};
      if (startDate) where.readingTime.gte = new Date(startDate);
      if (endDate) where.readingTime.lte = new Date(endDate);
    }
    return this.prisma.readings_history.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { readingTime: 'desc' } });
  }

  async getLatestByStation(stationId: string) {
    const points = await this.prisma.monitoring_points.findMany({ where: { stationId }, include: { liveReadings: { take: 1, orderBy: { readingTime: 'desc' } } } });
    return points.map(p => ({ pointId: p.id, pointCode: p.pointCode, name: p.name, unit: p.unit, latestReading: p.liveReadings[0] || null }));
  }
}
