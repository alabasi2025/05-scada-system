import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStationDto, UpdateStationDto, StationQueryDto } from './dto';

@Injectable()
export class StationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStationDto) {
    const existing = await this.prisma.scada_stations.findUnique({
      where: { code: dto.code }
    });
    
    if (existing) {
      throw new ConflictException(`محطة بالكود ${dto.code} موجودة مسبقاً`);
    }

    return this.prisma.scada_stations.create({
      data: {
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        type: dto.type,
        voltageLevel: dto.voltageLevel,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        capacity: dto.capacity,
        businessId: dto.businessId,
      },
      include: {
        devices: true,
        _count: {
          select: {
            devices: true,
            monitoringPoints: true,
            alerts: true
          }
        }
      }
    });
  }

  async findAll(query: StationQueryDto) {
    const { type, status, isActive, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.scada_stations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              devices: true,
              monitoringPoints: true,
              alerts: { where: { status: 'active' } }
            }
          }
        }
      }),
      this.prisma.scada_stations.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const station = await this.prisma.scada_stations.findUnique({
      where: { id },
      include: {
        devices: {
          include: {
            _count: {
              select: { monitoringPoints: true }
            }
          }
        },
        monitoringPoints: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        },
        alerts: {
          where: { status: 'active' },
          take: 10,
          orderBy: { triggeredAt: 'desc' }
        },
        _count: {
          select: {
            devices: true,
            monitoringPoints: true,
            alerts: true,
            controlCommands: true
          }
        }
      }
    });

    if (!station) {
      throw new NotFoundException(`المحطة غير موجودة`);
    }

    return station;
  }

  async findByCode(code: string) {
    const station = await this.prisma.scada_stations.findUnique({
      where: { code },
      include: {
        devices: true,
        _count: {
          select: {
            devices: true,
            monitoringPoints: true,
            alerts: true
          }
        }
      }
    });

    if (!station) {
      throw new NotFoundException(`المحطة بالكود ${code} غير موجودة`);
    }

    return station;
  }

  async update(id: string, dto: UpdateStationDto) {
    await this.findOne(id);

    return this.prisma.scada_stations.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date()
      },
      include: {
        devices: true,
        _count: {
          select: {
            devices: true,
            monitoringPoints: true,
            alerts: true
          }
        }
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    
    return this.prisma.scada_stations.delete({
      where: { id }
    });
  }

  async getStats() {
    const [total, online, offline, maintenance, byType] = await Promise.all([
      this.prisma.scada_stations.count(),
      this.prisma.scada_stations.count({ where: { status: 'online' } }),
      this.prisma.scada_stations.count({ where: { status: 'offline' } }),
      this.prisma.scada_stations.count({ where: { status: 'maintenance' } }),
      this.prisma.scada_stations.groupBy({
        by: ['type'],
        _count: { id: true }
      })
    ]);

    return {
      total,
      online,
      offline,
      maintenance,
      byType: byType.map(t => ({ type: t.type, count: t._count.id }))
    };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    
    return this.prisma.scada_stations.update({
      where: { id },
      data: { 
        status,
        lastSyncAt: new Date()
      }
    });
  }
}
