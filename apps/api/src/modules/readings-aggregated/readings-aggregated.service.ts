import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ReadingsAggregatedQueryDto,
  AggregateReadingsDto,
  AggregationType,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReadingsAggregatedService {
  private readonly logger = new Logger(ReadingsAggregatedService.name);

  constructor(private prisma: PrismaService) {}

  async findHourly(query: ReadingsAggregatedQueryDto) {
    const { deviceId, dataPointId, startDate, endDate, page = 1, limit = 100 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaReadingHourlyWhereInput = {
      hour: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (deviceId) where.deviceId = deviceId;
    if (dataPointId) where.dataPointId = dataPointId;

    const [data, total] = await Promise.all([
      this.prisma.scadaReadingHourly.findMany({
        where,
        skip,
        take: limit,
        orderBy: { hour: 'desc' },
      }),
      this.prisma.scadaReadingHourly.count({ where }),
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

  async findDaily(query: ReadingsAggregatedQueryDto) {
    const { deviceId, dataPointId, startDate, endDate, page = 1, limit = 100 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaReadingDailyWhereInput = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (deviceId) where.deviceId = deviceId;
    if (dataPointId) where.dataPointId = dataPointId;

    const [data, total] = await Promise.all([
      this.prisma.scadaReadingDaily.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.scadaReadingDaily.count({ where }),
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

  async aggregateReadings(dto: AggregateReadingsDto) {
    const { deviceId, dataPointId, startDate, endDate, type } = dto;

    if (type === AggregationType.HOURLY) {
      return this.aggregateHourly(deviceId, dataPointId, new Date(startDate), new Date(endDate));
    } else {
      return this.aggregateDaily(deviceId, dataPointId, new Date(startDate), new Date(endDate));
    }
  }

  private async aggregateHourly(
    deviceId: string,
    dataPointId: string | undefined,
    startDate: Date,
    endDate: Date,
  ) {
    let recordsCreated = 0;
    let recordsUpdated = 0;

    // جلب نقاط القياس
    const dataPointsWhere: Prisma.ScadaDataPointWhereInput = { deviceId };
    if (dataPointId) dataPointsWhere.id = dataPointId;

    const dataPoints = await this.prisma.scadaDataPoint.findMany({
      where: dataPointsWhere,
    });

    for (const dp of dataPoints) {
      // تجميع القراءات بالساعة
      const hourlyData = await this.prisma.$queryRaw<any[]>`
        SELECT 
          date_trunc('hour', timestamp) as hour,
          MIN(value) as min_value,
          MAX(value) as max_value,
          AVG(value) as avg_value,
          SUM(value) as sum_value,
          COUNT(*) as reading_count
        FROM scada_readings
        WHERE device_id = ${deviceId}::uuid
          AND data_point_id = ${dp.id}::uuid
          AND timestamp >= ${startDate}
          AND timestamp <= ${endDate}
        GROUP BY date_trunc('hour', timestamp)
        ORDER BY hour
      `;

      for (const row of hourlyData) {
        const existing = await this.prisma.scadaReadingHourly.findUnique({
          where: {
            dataPointId_hour: {
              dataPointId: dp.id,
              hour: row.hour,
            },
          },
        });

        if (existing) {
          await this.prisma.scadaReadingHourly.update({
            where: { id: existing.id },
            data: {
              minValue: row.min_value,
              maxValue: row.max_value,
              avgValue: row.avg_value,
              sumValue: row.sum_value,
              readingCount: Number(row.reading_count),
            },
          });
          recordsUpdated++;
        } else {
          await this.prisma.scadaReadingHourly.create({
            data: {
              deviceId,
              dataPointId: dp.id,
              hour: row.hour,
              minValue: row.min_value,
              maxValue: row.max_value,
              avgValue: row.avg_value,
              sumValue: row.sum_value,
              readingCount: Number(row.reading_count),
            },
          });
          recordsCreated++;
        }
      }
    }

    return {
      success: true,
      message: 'تم تجميع القراءات بالساعة بنجاح',
      recordsCreated,
      recordsUpdated,
    };
  }

  private async aggregateDaily(
    deviceId: string,
    dataPointId: string | undefined,
    startDate: Date,
    endDate: Date,
  ) {
    let recordsCreated = 0;
    let recordsUpdated = 0;

    // جلب نقاط القياس
    const dataPointsWhere: Prisma.ScadaDataPointWhereInput = { deviceId };
    if (dataPointId) dataPointsWhere.id = dataPointId;

    const dataPoints = await this.prisma.scadaDataPoint.findMany({
      where: dataPointsWhere,
    });

    for (const dp of dataPoints) {
      // تجميع القراءات باليوم
      const dailyData = await this.prisma.$queryRaw<any[]>`
        SELECT 
          date_trunc('day', timestamp) as date,
          MIN(value) as min_value,
          MAX(value) as max_value,
          AVG(value) as avg_value,
          SUM(value) as sum_value,
          COUNT(*) as reading_count
        FROM scada_readings
        WHERE device_id = ${deviceId}::uuid
          AND data_point_id = ${dp.id}::uuid
          AND timestamp >= ${startDate}
          AND timestamp <= ${endDate}
        GROUP BY date_trunc('day', timestamp)
        ORDER BY date
      `;

      for (const row of dailyData) {
        const existing = await this.prisma.scadaReadingDaily.findUnique({
          where: {
            dataPointId_date: {
              dataPointId: dp.id,
              date: row.date,
            },
          },
        });

        if (existing) {
          await this.prisma.scadaReadingDaily.update({
            where: { id: existing.id },
            data: {
              minValue: row.min_value,
              maxValue: row.max_value,
              avgValue: row.avg_value,
              sumValue: row.sum_value,
              readingCount: Number(row.reading_count),
            },
          });
          recordsUpdated++;
        } else {
          await this.prisma.scadaReadingDaily.create({
            data: {
              deviceId,
              dataPointId: dp.id,
              date: row.date,
              minValue: row.min_value,
              maxValue: row.max_value,
              avgValue: row.avg_value,
              sumValue: row.sum_value,
              readingCount: Number(row.reading_count),
            },
          });
          recordsCreated++;
        }
      }
    }

    return {
      success: true,
      message: 'تم تجميع القراءات باليوم بنجاح',
      recordsCreated,
      recordsUpdated,
    };
  }

  // تجميع تلقائي كل ساعة
  @Cron(CronExpression.EVERY_HOUR)
  async autoAggregateHourly() {
    this.logger.log('بدء التجميع التلقائي بالساعة...');

    const devices = await this.prisma.scadaDevice.findMany({
      where: { status: 'active' },
    });

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const device of devices) {
      try {
        await this.aggregateHourly(device.id, undefined, oneHourAgo, now);
      } catch (error) {
        this.logger.error(`فشل تجميع الجهاز ${device.code}: ${error.message}`);
      }
    }

    this.logger.log('انتهى التجميع التلقائي بالساعة');
  }

  // تجميع تلقائي يومي
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async autoAggregateDaily() {
    this.logger.log('بدء التجميع التلقائي اليومي...');

    const devices = await this.prisma.scadaDevice.findMany({
      where: { status: 'active' },
    });

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const device of devices) {
      try {
        await this.aggregateDaily(device.id, undefined, yesterday, now);
      } catch (error) {
        this.logger.error(`فشل تجميع الجهاز ${device.code}: ${error.message}`);
      }
    }

    this.logger.log('انتهى التجميع التلقائي اليومي');
  }

  async getStatistics(deviceId?: string) {
    const hourlyWhere: Prisma.ScadaReadingHourlyWhereInput = {};
    const dailyWhere: Prisma.ScadaReadingDailyWhereInput = {};

    if (deviceId) {
      hourlyWhere.deviceId = deviceId;
      dailyWhere.deviceId = deviceId;
    }

    const [hourlyCount, dailyCount, latestHourly, latestDaily] = await Promise.all([
      this.prisma.scadaReadingHourly.count({ where: hourlyWhere }),
      this.prisma.scadaReadingDaily.count({ where: dailyWhere }),
      this.prisma.scadaReadingHourly.findFirst({
        where: hourlyWhere,
        orderBy: { hour: 'desc' },
      }),
      this.prisma.scadaReadingDaily.findFirst({
        where: dailyWhere,
        orderBy: { date: 'desc' },
      }),
    ]);

    return {
      hourly: {
        count: hourlyCount,
        latestHour: latestHourly?.hour,
      },
      daily: {
        count: dailyCount,
        latestDate: latestDaily?.date,
      },
    };
  }
}
