import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStationDto, UpdateStationDto, StationQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStationDto: CreateStationDto) {
    // التحقق من عدم وجود محطة بنفس الرمز
    const existingStation = await this.prisma.scadaStation.findUnique({
      where: { code: createStationDto.code },
    });

    if (existingStation) {
      throw new ConflictException(`محطة بالرمز ${createStationDto.code} موجودة مسبقاً`);
    }

    return this.prisma.scadaStation.create({
      data: {
        ...createStationDto,
        capacity: createStationDto.capacity ? new Prisma.Decimal(createStationDto.capacity) : null,
        latitude: createStationDto.latitude ? new Prisma.Decimal(createStationDto.latitude) : null,
        longitude: createStationDto.longitude ? new Prisma.Decimal(createStationDto.longitude) : null,
        commissionDate: createStationDto.commissionDate ? new Date(createStationDto.commissionDate) : null,
      },
    });
  }

  async findAll(query: StationQueryDto) {
    const { page = 1, limit = 10, type, status, voltage, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaStationWhereInput = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (voltage) where.voltage = voltage;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.scadaStation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              devices: true,
              alarms: { where: { status: 'active' } },
            },
          },
        },
      }),
      this.prisma.scadaStation.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const station = await this.prisma.scadaStation.findUnique({
      where: { id },
      include: {
        devices: {
          include: {
            _count: {
              select: { dataPoints: true },
            },
          },
        },
        connection: true,
        _count: {
          select: {
            alarms: { where: { status: 'active' } },
          },
        },
      },
    });

    if (!station) {
      throw new NotFoundException(`المحطة بالمعرف ${id} غير موجودة`);
    }

    return station;
  }

  async update(id: string, updateStationDto: UpdateStationDto) {
    await this.findOne(id);

    // التحقق من عدم تكرار الرمز
    if (updateStationDto.code) {
      const existingStation = await this.prisma.scadaStation.findFirst({
        where: {
          code: updateStationDto.code,
          NOT: { id },
        },
      });

      if (existingStation) {
        throw new ConflictException(`محطة بالرمز ${updateStationDto.code} موجودة مسبقاً`);
      }
    }

    return this.prisma.scadaStation.update({
      where: { id },
      data: {
        ...updateStationDto,
        capacity: updateStationDto.capacity !== undefined
          ? (updateStationDto.capacity ? new Prisma.Decimal(updateStationDto.capacity) : null)
          : undefined,
        latitude: updateStationDto.latitude !== undefined
          ? (updateStationDto.latitude ? new Prisma.Decimal(updateStationDto.latitude) : null)
          : undefined,
        longitude: updateStationDto.longitude !== undefined
          ? (updateStationDto.longitude ? new Prisma.Decimal(updateStationDto.longitude) : null)
          : undefined,
        commissionDate: updateStationDto.commissionDate
          ? new Date(updateStationDto.commissionDate)
          : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.scadaStation.delete({ where: { id } });
  }

  async getDevices(id: string) {
    await this.findOne(id);
    return this.prisma.scadaDevice.findMany({
      where: { stationId: id },
      include: {
        _count: {
          select: { dataPoints: true, readings: true },
        },
      },
    });
  }

  async getReadings(id: string, startDate?: Date, endDate?: Date) {
    await this.findOne(id);
    
    const devices = await this.prisma.scadaDevice.findMany({
      where: { stationId: id },
      select: { id: true },
    });

    const deviceIds = devices.map(d => d.id);

    return this.prisma.scadaReading.findMany({
      where: {
        deviceId: { in: deviceIds },
        ...(startDate && endDate && {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
      include: {
        device: { select: { code: true, name: true } },
        dataPoint: { select: { code: true, name: true, unit: true } },
      },
    });
  }

  async getAlarms(id: string, status?: string) {
    await this.findOne(id);
    return this.prisma.scadaAlarm.findMany({
      where: {
        stationId: id,
        ...(status && { status }),
      },
      orderBy: { triggeredAt: 'desc' },
      include: {
        device: { select: { code: true, name: true } },
        dataPoint: { select: { code: true, name: true, unit: true } },
      },
    });
  }

  async getMapData() {
    return this.prisma.scadaStation.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        voltage: true,
        status: true,
        latitude: true,
        longitude: true,
        _count: {
          select: {
            devices: true,
            alarms: { where: { status: 'active' } },
          },
        },
      },
    });
  }

  async getStatistics() {
    const [total, byType, byStatus, byVoltage] = await Promise.all([
      this.prisma.scadaStation.count(),
      this.prisma.scadaStation.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.scadaStation.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.scadaStation.groupBy({
        by: ['voltage'],
        _count: true,
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      byVoltage: byVoltage.reduce((acc, item) => ({ ...acc, [item.voltage]: item._count }), {}),
    };
  }
}
