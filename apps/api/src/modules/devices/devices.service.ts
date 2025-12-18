import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto) {
    // التحقق من وجود المحطة
    const station = await this.prisma.scadaStation.findUnique({
      where: { id: createDeviceDto.stationId },
    });

    if (!station) {
      throw new NotFoundException(`المحطة بالمعرف ${createDeviceDto.stationId} غير موجودة`);
    }

    // التحقق من عدم وجود جهاز بنفس الرمز
    const existingDevice = await this.prisma.scadaDevice.findUnique({
      where: { code: createDeviceDto.code },
    });

    if (existingDevice) {
      throw new ConflictException(`جهاز بالرمز ${createDeviceDto.code} موجود مسبقاً`);
    }

    return this.prisma.scadaDevice.create({
      data: {
        ...createDeviceDto,
        ratedCapacity: createDeviceDto.ratedCapacity ? new Prisma.Decimal(createDeviceDto.ratedCapacity) : null,
        ratedVoltage: createDeviceDto.ratedVoltage ? new Prisma.Decimal(createDeviceDto.ratedVoltage) : null,
        ratedCurrent: createDeviceDto.ratedCurrent ? new Prisma.Decimal(createDeviceDto.ratedCurrent) : null,
        installDate: createDeviceDto.installDate ? new Date(createDeviceDto.installDate) : null,
      },
      include: {
        station: { select: { code: true, name: true } },
      },
    });
  }

  async findAll(query: DeviceQueryDto) {
    const { page = 1, limit = 10, stationId, type, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaDeviceWhereInput = {};

    if (stationId) where.stationId = stationId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { serialNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.scadaDevice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          station: { select: { code: true, name: true } },
          _count: {
            select: {
              dataPoints: true,
              readings: true,
              alarms: { where: { status: 'active' } },
            },
          },
        },
      }),
      this.prisma.scadaDevice.count({ where }),
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
    const device = await this.prisma.scadaDevice.findUnique({
      where: { id },
      include: {
        station: { select: { id: true, code: true, name: true } },
        dataPoints: true,
        _count: {
          select: {
            readings: true,
            alarms: { where: { status: 'active' } },
            commands: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`الجهاز بالمعرف ${id} غير موجود`);
    }

    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    await this.findOne(id);

    // التحقق من عدم تكرار الرمز
    if (updateDeviceDto.code) {
      const existingDevice = await this.prisma.scadaDevice.findFirst({
        where: {
          code: updateDeviceDto.code,
          NOT: { id },
        },
      });

      if (existingDevice) {
        throw new ConflictException(`جهاز بالرمز ${updateDeviceDto.code} موجود مسبقاً`);
      }
    }

    // التحقق من وجود المحطة الجديدة
    if (updateDeviceDto.stationId) {
      const station = await this.prisma.scadaStation.findUnique({
        where: { id: updateDeviceDto.stationId },
      });

      if (!station) {
        throw new NotFoundException(`المحطة بالمعرف ${updateDeviceDto.stationId} غير موجودة`);
      }
    }

    return this.prisma.scadaDevice.update({
      where: { id },
      data: {
        ...updateDeviceDto,
        ratedCapacity: updateDeviceDto.ratedCapacity !== undefined
          ? (updateDeviceDto.ratedCapacity ? new Prisma.Decimal(updateDeviceDto.ratedCapacity) : null)
          : undefined,
        ratedVoltage: updateDeviceDto.ratedVoltage !== undefined
          ? (updateDeviceDto.ratedVoltage ? new Prisma.Decimal(updateDeviceDto.ratedVoltage) : null)
          : undefined,
        ratedCurrent: updateDeviceDto.ratedCurrent !== undefined
          ? (updateDeviceDto.ratedCurrent ? new Prisma.Decimal(updateDeviceDto.ratedCurrent) : null)
          : undefined,
        installDate: updateDeviceDto.installDate
          ? new Date(updateDeviceDto.installDate)
          : undefined,
      },
      include: {
        station: { select: { code: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.scadaDevice.delete({ where: { id } });
  }

  async getReadings(id: string, startDate?: Date, endDate?: Date, limit = 100) {
    await this.findOne(id);

    return this.prisma.scadaReading.findMany({
      where: {
        deviceId: id,
        ...(startDate && endDate && {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        dataPoint: { select: { code: true, name: true, unit: true } },
      },
    });
  }

  async getDataPoints(id: string) {
    await this.findOne(id);

    return this.prisma.scadaDataPoint.findMany({
      where: { deviceId: id },
      orderBy: { code: 'asc' },
    });
  }

  async getLatestReadings(id: string) {
    await this.findOne(id);

    const dataPoints = await this.prisma.scadaDataPoint.findMany({
      where: { deviceId: id, isActive: true },
    });

    const latestReadings = await Promise.all(
      dataPoints.map(async (dp) => {
        const reading = await this.prisma.scadaReading.findFirst({
          where: { dataPointId: dp.id },
          orderBy: { timestamp: 'desc' },
        });
        return {
          dataPoint: dp,
          reading,
        };
      })
    );

    return latestReadings;
  }

  async getStatistics() {
    const [total, byType, byStatus] = await Promise.all([
      this.prisma.scadaDevice.count(),
      this.prisma.scadaDevice.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.scadaDevice.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
    };
  }
}
