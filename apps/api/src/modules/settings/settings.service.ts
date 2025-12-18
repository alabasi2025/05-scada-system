import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSettingDto, UpdateSettingDto, SettingQueryDto, SettingType } from './dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSettingDto) {
    const existing = await this.prisma.scadaSetting.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(`الإعداد موجود مسبقاً: ${dto.key}`);
    }

    return this.prisma.scadaSetting.create({
      data: {
        key: dto.key,
        value: dto.value,
        type: dto.type,
        category: dto.category,
      },
    });
  }

  async findAll(query: SettingQueryDto) {
    const { category } = query;

    const where = category ? { category } : {};

    const settings = await this.prisma.scadaSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return { data: settings };
  }

  async findByKey(key: string) {
    const setting = await this.prisma.scadaSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`الإعداد غير موجود: ${key}`);
    }

    return setting;
  }

  async getValue(key: string, defaultValue?: string): Promise<string> {
    try {
      const setting = await this.findByKey(key);
      return setting.value;
    } catch {
      return defaultValue ?? '';
    }
  }

  async getTypedValue<T>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.findByKey(key);
      
      switch (setting.type) {
        case SettingType.NUMBER:
          return Number(setting.value) as T;
        case SettingType.BOOLEAN:
          return (setting.value === 'true') as T;
        case SettingType.JSON:
          return JSON.parse(setting.value) as T;
        default:
          return setting.value as T;
      }
    } catch {
      return defaultValue as T;
    }
  }

  async update(key: string, dto: UpdateSettingDto) {
    await this.findByKey(key);

    return this.prisma.scadaSetting.update({
      where: { key },
      data: { value: dto.value },
    });
  }

  async upsert(dto: CreateSettingDto) {
    return this.prisma.scadaSetting.upsert({
      where: { key: dto.key },
      update: { value: dto.value },
      create: {
        key: dto.key,
        value: dto.value,
        type: dto.type,
        category: dto.category,
      },
    });
  }

  async remove(key: string) {
    await this.findByKey(key);

    return this.prisma.scadaSetting.delete({
      where: { key },
    });
  }

  async getByCategory(category: string) {
    const settings = await this.prisma.scadaSetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    // Convert to key-value object
    return settings.reduce((acc, setting) => {
      let value: any = setting.value;
      
      switch (setting.type) {
        case SettingType.NUMBER:
          value = Number(setting.value);
          break;
        case SettingType.BOOLEAN:
          value = setting.value === 'true';
          break;
        case SettingType.JSON:
          try {
            value = JSON.parse(setting.value);
          } catch {
            value = setting.value;
          }
          break;
      }
      
      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);
  }

  async initializeDefaults() {
    const defaults = [
      // General settings
      { key: 'system.name', value: 'نظام SCADA', type: SettingType.STRING, category: 'general' },
      { key: 'system.version', value: '1.0.0', type: SettingType.STRING, category: 'general' },
      
      // Alarm settings
      { key: 'alarm.sound.enabled', value: 'true', type: SettingType.BOOLEAN, category: 'alarm' },
      { key: 'alarm.auto_acknowledge.timeout', value: '3600', type: SettingType.NUMBER, category: 'alarm' },
      { key: 'alarm.critical.notification', value: 'true', type: SettingType.BOOLEAN, category: 'alarm' },
      
      // Notification settings
      { key: 'notification.email.enabled', value: 'false', type: SettingType.BOOLEAN, category: 'notification' },
      { key: 'notification.sms.enabled', value: 'false', type: SettingType.BOOLEAN, category: 'notification' },
      
      // Modbus settings
      { key: 'modbus.default.timeout', value: '3000', type: SettingType.NUMBER, category: 'modbus' },
      { key: 'modbus.default.poll_interval', value: '5', type: SettingType.NUMBER, category: 'modbus' },
      { key: 'modbus.retry.count', value: '3', type: SettingType.NUMBER, category: 'modbus' },
      
      // Display settings
      { key: 'display.refresh_interval', value: '5000', type: SettingType.NUMBER, category: 'display' },
      { key: 'display.chart.points', value: '100', type: SettingType.NUMBER, category: 'display' },
    ];

    let created = 0;
    for (const setting of defaults) {
      const existing = await this.prisma.scadaSetting.findUnique({
        where: { key: setting.key },
      });

      if (!existing) {
        await this.prisma.scadaSetting.create({ data: setting });
        created++;
      }
    }

    return { message: `تم إنشاء ${created} إعداد افتراضي` };
  }
}
