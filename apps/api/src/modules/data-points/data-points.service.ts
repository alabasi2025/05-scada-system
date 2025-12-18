import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDataPointDto, UpdateDataPointDto, DataPointQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DataPointsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDataPointDto: CreateDataPointDto) {
    // التحقق من وجود الجهاز
    const device = await this.prisma.scadaDevice.findUnique({
      where: { id: createDataPointDto.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`الجهاز بالمعرف ${createDataPointDto.deviceId} غير موجود`);
    }

    // التحقق من عدم وجود نقطة قياس بنفس الرمز للجهاز
    const existingDataPoint = await this.prisma.scadaDataPoint.findFirst({
      where: {
        deviceId: createDataPointDto.deviceId,
        code: createDataPointDto.code,
      },
    });

    if (existingDataPoint) {
      throw new ConflictException(`نقطة قياس بالرمز ${createDataPointDto.code} موجودة مسبقاً لهذا الجهاز`);
    }

    const decimalFields = ['minValue', 'maxValue', 'warningLow', 'warningHigh', 'alarmLow', 'alarmHigh', 'scaleFactor'];
    const data: any = { ...createDataPointDto };

    decimalFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        data[field] = new Prisma.Decimal(data[field]);
      }
    });

    return this.prisma.scadaDataPoint.create({
      data,
      include: {
        device: { select: { code: true, name: true } },
      },
    });
  }

  async findAll(query: DataPointQueryDto) {
    const { page = 1, limit = 10, deviceId, dataType, isActive, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaDataPointWhereInput = {};

    if (deviceId) where.deviceId = deviceId;
    if (dataType) where.dataType = dataType;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.scadaDataPoint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          device: {
            select: {
              code: true,
              name: true,
              station: { select: { code: true, name: true } },
            },
          },
        },
      }),
      this.prisma.scadaDataPoint.count({ where }),
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
    const dataPoint = await this.prisma.scadaDataPoint.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            id: true,
            code: true,
            name: true,
            station: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    if (!dataPoint) {
      throw new NotFoundException(`نقطة القياس بالمعرف ${id} غير موجودة`);
    }

    return dataPoint;
  }

  async update(id: string, updateDataPointDto: UpdateDataPointDto) {
    await this.findOne(id);

    // التحقق من عدم تكرار الرمز
    if (updateDataPointDto.code && updateDataPointDto.deviceId) {
      const existingDataPoint = await this.prisma.scadaDataPoint.findFirst({
        where: {
          deviceId: updateDataPointDto.deviceId,
          code: updateDataPointDto.code,
          NOT: { id },
        },
      });

      if (existingDataPoint) {
        throw new ConflictException(`نقطة قياس بالرمز ${updateDataPointDto.code} موجودة مسبقاً لهذا الجهاز`);
      }
    }

    const decimalFields = ['minValue', 'maxValue', 'warningLow', 'warningHigh', 'alarmLow', 'alarmHigh', 'scaleFactor'];
    const data: any = { ...updateDataPointDto };

    decimalFields.forEach(field => {
      if (data[field] !== undefined) {
        data[field] = data[field] !== null ? new Prisma.Decimal(data[field]) : null;
      }
    });

    return this.prisma.scadaDataPoint.update({
      where: { id },
      data,
      include: {
        device: { select: { code: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.scadaDataPoint.delete({ where: { id } });
  }

  async getReadings(id: string, startDate?: Date, endDate?: Date, limit = 100) {
    await this.findOne(id);

    return this.prisma.scadaReading.findMany({
      where: {
        dataPointId: id,
        ...(startDate && endDate && {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getLatestReading(id: string) {
    await this.findOne(id);

    return this.prisma.scadaReading.findFirst({
      where: { dataPointId: id },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getStatistics(id: string, startDate: Date, endDate: Date) {
    await this.findOne(id);

    const readings = await this.prisma.scadaReading.findMany({
      where: {
        dataPointId: id,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { value: true },
    });

    if (readings.length === 0) {
      return {
        count: 0,
        min: null,
        max: null,
        avg: null,
        sum: null,
      };
    }

    const values = readings.map(r => Number(r.value));
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: readings.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / readings.length,
      sum,
    };
  }
}
