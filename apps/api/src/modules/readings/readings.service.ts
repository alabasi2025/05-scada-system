import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReadingDto, CreateBulkReadingsDto, ReadingQueryDto, HistoricalReadingQueryDto } from './dto';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReadingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createReadingDto: CreateReadingDto) {
    // التحقق من وجود الجهاز
    const device = await this.prisma.scadaDevice.findUnique({
      where: { id: createReadingDto.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`الجهاز بالمعرف ${createReadingDto.deviceId} غير موجود`);
    }

    // التحقق من وجود نقطة القياس
    const dataPoint = await this.prisma.scadaDataPoint.findUnique({
      where: { id: createReadingDto.dataPointId },
    });

    if (!dataPoint) {
      throw new NotFoundException(`نقطة القياس بالمعرف ${createReadingDto.dataPointId} غير موجودة`);
    }

    const reading = await this.prisma.scadaReading.create({
      data: {
        deviceId: createReadingDto.deviceId,
        dataPointId: createReadingDto.dataPointId,
        value: new Prisma.Decimal(createReadingDto.value),
        quality: createReadingDto.quality || 'good',
        timestamp: createReadingDto.timestamp ? new Date(createReadingDto.timestamp) : new Date(),
      },
      include: {
        device: { select: { code: true, name: true, stationId: true } },
        dataPoint: { select: { code: true, name: true, unit: true, alarmHigh: true, alarmLow: true, warningHigh: true, warningLow: true } },
      },
    });

    // تحديث آخر قراءة للجهاز
    await this.prisma.scadaDevice.update({
      where: { id: createReadingDto.deviceId },
      data: { lastReadingAt: reading.timestamp },
    });

    // إرسال حدث القراءة الجديدة
    this.eventEmitter.emit('reading.created', reading);

    // فحص التنبيهات
    await this.checkAlarms(reading, dataPoint);

    return reading;
  }

  async createBulk(createBulkReadingsDto: CreateBulkReadingsDto) {
    const results = [];

    for (const readingDto of createBulkReadingsDto.readings) {
      try {
        const reading = await this.create(readingDto);
        results.push({ success: true, reading });
      } catch (error) {
        results.push({ success: false, error: error.message, data: readingDto });
      }
    }

    return {
      total: createBulkReadingsDto.readings.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  async findAll(query: ReadingQueryDto) {
    const { page = 1, limit = 100, deviceId, dataPointId, startDate, endDate, quality } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScadaReadingWhereInput = {};

    if (deviceId) where.deviceId = deviceId;
    if (dataPointId) where.dataPointId = dataPointId;
    if (quality) where.quality = quality;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.scadaReading.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          device: { select: { code: true, name: true } },
          dataPoint: { select: { code: true, name: true, unit: true } },
        },
      }),
      this.prisma.scadaReading.count({ where }),
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

  async getLiveReadings(deviceId: string) {
    const device = await this.prisma.scadaDevice.findUnique({
      where: { id: deviceId },
      include: {
        dataPoints: { where: { isActive: true } },
      },
    });

    if (!device) {
      throw new NotFoundException(`الجهاز بالمعرف ${deviceId} غير موجود`);
    }

    const latestReadings = await Promise.all(
      device.dataPoints.map(async (dp) => {
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

    return {
      device: {
        id: device.id,
        code: device.code,
        name: device.name,
        status: device.status,
        lastReadingAt: device.lastReadingAt,
      },
      readings: latestReadings,
    };
  }

  async getHistoricalReadings(query: HistoricalReadingQueryDto) {
    const { deviceId, dataPointId, startDate, endDate, interval = 60 } = query;

    const where: Prisma.ScadaReadingWhereInput = {
      deviceId,
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (dataPointId) {
      where.dataPointId = dataPointId;
    }

    const readings = await this.prisma.scadaReading.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      include: {
        dataPoint: { select: { code: true, name: true, unit: true } },
      },
    });

    // تجميع القراءات حسب الفترة الزمنية
    const groupedReadings = this.groupReadingsByInterval(readings, interval);

    return groupedReadings;
  }

  async getHourlyReadings(deviceId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.scadaReadingHourly.findMany({
      where: {
        deviceId,
        hour: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { hour: 'asc' },
    });
  }

  async getDailyReadings(deviceId: string, startDate: Date, endDate: Date) {
    return this.prisma.scadaReadingDaily.findMany({
      where: {
        deviceId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  private groupReadingsByInterval(readings: any[], intervalMinutes: number) {
    const grouped: { [key: string]: any[] } = {};

    readings.forEach(reading => {
      const timestamp = new Date(reading.timestamp);
      const intervalStart = new Date(
        Math.floor(timestamp.getTime() / (intervalMinutes * 60000)) * (intervalMinutes * 60000)
      );
      const key = intervalStart.toISOString();

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(reading);
    });

    return Object.entries(grouped).map(([timestamp, readings]) => {
      const values = readings.map(r => Number(r.value));
      return {
        timestamp,
        count: readings.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        readings: readings.slice(0, 10), // أول 10 قراءات فقط
      };
    });
  }

  private async checkAlarms(reading: any, dataPoint: any) {
    const value = Number(reading.value);
    let severity: string | null = null;
    let message: string | null = null;

    // فحص حدود الإنذار
    if (dataPoint.alarmHigh && value > Number(dataPoint.alarmHigh)) {
      severity = 'critical';
      message = `${dataPoint.name} تجاوز الحد الأعلى للإنذار: ${value} ${dataPoint.unit}`;
    } else if (dataPoint.alarmLow && value < Number(dataPoint.alarmLow)) {
      severity = 'critical';
      message = `${dataPoint.name} أقل من الحد الأدنى للإنذار: ${value} ${dataPoint.unit}`;
    } else if (dataPoint.warningHigh && value > Number(dataPoint.warningHigh)) {
      severity = 'warning';
      message = `${dataPoint.name} تجاوز حد التحذير الأعلى: ${value} ${dataPoint.unit}`;
    } else if (dataPoint.warningLow && value < Number(dataPoint.warningLow)) {
      severity = 'warning';
      message = `${dataPoint.name} أقل من حد التحذير الأدنى: ${value} ${dataPoint.unit}`;
    }

    if (severity && message) {
      // إنشاء تنبيه جديد
      const alarmNo = `ALM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const alarm = await this.prisma.scadaAlarm.create({
        data: {
          alarmNo,
          stationId: reading.device.stationId,
          deviceId: reading.deviceId,
          dataPointId: reading.dataPointId,
          severity,
          message,
          value: new Prisma.Decimal(value),
          threshold: severity === 'critical' 
            ? (value > Number(dataPoint.alarmHigh) ? dataPoint.alarmHigh : dataPoint.alarmLow)
            : (value > Number(dataPoint.warningHigh) ? dataPoint.warningHigh : dataPoint.warningLow),
        },
      });

      // إرسال حدث التنبيه
      this.eventEmitter.emit('alarm.created', alarm);
    }
  }
}
