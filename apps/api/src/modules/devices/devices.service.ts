import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceQueryDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDeviceDto) {
    return this.prisma.scada_devices.create({ data: dto as any });
  }

  async findAll(query: DeviceQueryDto) {
    const { stationId, type, status, page = 1, limit = 20 } = query;
    const where: any = {};
    if (stationId) where.stationId = stationId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.scada_devices.findMany({ where, skip: (page - 1) * limit, take: limit, include: { station: true, _count: { select: { monitoringPoints: true } } } }),
      this.prisma.scada_devices.count({ where })
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const device = await this.prisma.scada_devices.findUnique({ where: { id }, include: { station: true, monitoringPoints: true } });
    if (!device) throw new NotFoundException('الجهاز غير موجود');
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto) {
    await this.findOne(id);
    return this.prisma.scada_devices.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.scada_devices.delete({ where: { id } });
  }
}
