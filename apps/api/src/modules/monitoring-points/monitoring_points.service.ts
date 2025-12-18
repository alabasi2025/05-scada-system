import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMonitoringPointDto, UpdateMonitoringPointDto, MonitoringPointQueryDto } from './dto';

@Injectable()
export class MonitoringPointsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMonitoringPointDto) {
    return this.prisma.monitoring_points.create({ data: dto as any });
  }

  async findAll(query: MonitoringPointQueryDto) {
    const { stationId, deviceId, pointType, dataType, page = 1, limit = 50 } = query;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (deviceId) where.deviceId = deviceId;
    if (pointType) where.pointType = pointType;
    if (dataType) where.dataType = dataType;

    const [data, total] = await Promise.all([
      this.prisma.monitoring_points.findMany({ where, skip: (page - 1) * limit, take: limit, include: { station: true, device: true, liveReadings: { take: 1, orderBy: { readingTime: 'desc' } } } }),
      this.prisma.monitoring_points.count({ where })
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const point = await this.prisma.monitoring_points.findUnique({ where: { id }, include: { station: true, device: true, liveReadings: { take: 100, orderBy: { readingTime: 'desc' } } } });
    if (!point) throw new NotFoundException('نقطة المراقبة غير موجودة');
    return point;
  }

  async update(id: string, dto: UpdateMonitoringPointDto) {
    await this.findOne(id);
    return this.prisma.monitoring_points.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.monitoring_points.delete({ where: { id } });
  }
}
