import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AlarmRulesService } from '../alarm-rules/alarm-rules.service';
import { EventLogsService } from '../event-logs/event-logs.service';
import { AlarmCondition, AlarmSeverity } from '../alarm-rules/dto';

interface ReadingData {
  stationId: string;
  deviceId: string;
  dataPointId: string;
  value: number;
  rawValue: number;
  quality: string;
  timestamp: Date;
}

interface AlarmRule {
  id: string;
  name: string;
  description?: string;
  dataPointId?: string;
  deviceId?: string;
  stationId?: string;
  condition: string;
  threshold1: number;
  threshold2?: number;
  severity: string;
  isActive: boolean;
}

@Injectable()
export class AlarmEngineService implements OnModuleInit {
  private readonly logger = new Logger(AlarmEngineService.name);
  private rules: AlarmRule[] = [];
  private activeAlarms: Map<string, string> = new Map(); // dataPointId -> alarmId

  constructor(
    private prisma: PrismaService,
    private alarmRulesService: AlarmRulesService,
    private eventLogs: EventLogsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.loadRules();
    this.logger.log(`Alarm Engine initialized with ${this.rules.length} rules`);
  }

  async loadRules(): Promise<void> {
    const rules = await this.alarmRulesService.getActiveRules();
    this.rules = rules.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || undefined,
      dataPointId: r.dataPointId || undefined,
      deviceId: r.deviceId || undefined,
      stationId: r.stationId || undefined,
      condition: r.condition,
      threshold1: Number(r.threshold1),
      threshold2: r.threshold2 ? Number(r.threshold2) : undefined,
      severity: r.severity,
      isActive: r.isActive,
    }));
    this.logger.log(`Loaded ${this.rules.length} alarm rules`);
  }

  @OnEvent('readings.new')
  async handleNewReadings(payload: { stationId: string; deviceId: string; readings: ReadingData[] }) {
    for (const reading of payload.readings) {
      await this.evaluateReading(reading);
    }
  }

  async evaluateReading(reading: ReadingData): Promise<void> {
    // جلب نقطة القياس للحصول على حدود الإنذار
    const dataPoint = await this.prisma.scadaDataPoint.findUnique({
      where: { id: reading.dataPointId },
      include: {
        device: {
          include: {
            station: true,
          },
        },
      },
    });

    if (!dataPoint) return;

    // فحص حدود الإنذار المدمجة في نقطة القياس
    await this.checkBuiltInLimits(reading, dataPoint);

    // فحص قواعد الإنذار المخصصة
    await this.checkCustomRules(reading, dataPoint);
  }

  private async checkBuiltInLimits(reading: ReadingData, dataPoint: any): Promise<void> {
    const value = reading.value;
    const alarmKey = `builtin_${reading.dataPointId}`;

    // فحص الحد الأعلى الحرج (Alarm High)
    if (dataPoint.alarmHigh !== null && value >= Number(dataPoint.alarmHigh)) {
      await this.triggerAlarm({
        dataPointId: reading.dataPointId,
        deviceId: reading.deviceId,
        stationId: dataPoint.device.stationId,
        severity: 'critical',
        message: `${dataPoint.name}: القيمة ${value} ${dataPoint.unit} تجاوزت الحد الأعلى الحرج ${dataPoint.alarmHigh}`,
        value,
        threshold: Number(dataPoint.alarmHigh),
        alarmKey: `${alarmKey}_high`,
      });
    }
    // فحص الحد الأعلى التحذيري (Warning High)
    else if (dataPoint.warningHigh !== null && value >= Number(dataPoint.warningHigh)) {
      await this.triggerAlarm({
        dataPointId: reading.dataPointId,
        deviceId: reading.deviceId,
        stationId: dataPoint.device.stationId,
        severity: 'warning',
        message: `${dataPoint.name}: القيمة ${value} ${dataPoint.unit} تجاوزت حد التحذير الأعلى ${dataPoint.warningHigh}`,
        value,
        threshold: Number(dataPoint.warningHigh),
        alarmKey: `${alarmKey}_warning_high`,
      });
    }
    // فحص الحد الأدنى الحرج (Alarm Low)
    else if (dataPoint.alarmLow !== null && value <= Number(dataPoint.alarmLow)) {
      await this.triggerAlarm({
        dataPointId: reading.dataPointId,
        deviceId: reading.deviceId,
        stationId: dataPoint.device.stationId,
        severity: 'critical',
        message: `${dataPoint.name}: القيمة ${value} ${dataPoint.unit} أقل من الحد الأدنى الحرج ${dataPoint.alarmLow}`,
        value,
        threshold: Number(dataPoint.alarmLow),
        alarmKey: `${alarmKey}_low`,
      });
    }
    // فحص الحد الأدنى التحذيري (Warning Low)
    else if (dataPoint.warningLow !== null && value <= Number(dataPoint.warningLow)) {
      await this.triggerAlarm({
        dataPointId: reading.dataPointId,
        deviceId: reading.deviceId,
        stationId: dataPoint.device.stationId,
        severity: 'warning',
        message: `${dataPoint.name}: القيمة ${value} ${dataPoint.unit} أقل من حد التحذير الأدنى ${dataPoint.warningLow}`,
        value,
        threshold: Number(dataPoint.warningLow),
        alarmKey: `${alarmKey}_warning_low`,
      });
    }
    // القيمة ضمن النطاق الطبيعي - مسح الإنذارات
    else {
      await this.clearAlarmIfExists(`${alarmKey}_high`);
      await this.clearAlarmIfExists(`${alarmKey}_warning_high`);
      await this.clearAlarmIfExists(`${alarmKey}_low`);
      await this.clearAlarmIfExists(`${alarmKey}_warning_low`);
    }
  }

  private async checkCustomRules(reading: ReadingData, dataPoint: any): Promise<void> {
    // جلب القواعد المطبقة على هذه النقطة
    const applicableRules = this.rules.filter(rule => {
      if (rule.dataPointId && rule.dataPointId !== reading.dataPointId) return false;
      if (rule.deviceId && rule.deviceId !== reading.deviceId) return false;
      if (rule.stationId && rule.stationId !== dataPoint.device.stationId) return false;
      return true;
    });

    for (const rule of applicableRules) {
      const alarmKey = `rule_${rule.id}_${reading.dataPointId}`;
      const triggered = this.evaluateCondition(reading.value, rule);

      if (triggered) {
        await this.triggerAlarm({
          dataPointId: reading.dataPointId,
          deviceId: reading.deviceId,
          stationId: dataPoint.device.stationId,
          severity: rule.severity,
          message: `${rule.name}: ${dataPoint.name} = ${reading.value} ${dataPoint.unit}`,
          value: reading.value,
          threshold: rule.threshold1,
          alarmKey,
          ruleId: rule.id,
        });
      } else {
        await this.clearAlarmIfExists(alarmKey);
      }
    }
  }

  private evaluateCondition(value: number, rule: AlarmRule): boolean {
    switch (rule.condition) {
      case AlarmCondition.GT:
        return value > rule.threshold1;
      case AlarmCondition.LT:
        return value < rule.threshold1;
      case AlarmCondition.EQ:
        return value === rule.threshold1;
      case AlarmCondition.NE:
        return value !== rule.threshold1;
      case AlarmCondition.BETWEEN:
        return rule.threshold2 !== undefined && value >= rule.threshold1 && value <= rule.threshold2;
      case AlarmCondition.OUTSIDE:
        return rule.threshold2 !== undefined && (value < rule.threshold1 || value > rule.threshold2);
      default:
        return false;
    }
  }

  private async triggerAlarm(params: {
    dataPointId: string;
    deviceId: string;
    stationId: string;
    severity: string;
    message: string;
    value: number;
    threshold: number;
    alarmKey: string;
    ruleId?: string;
  }): Promise<void> {
    // التحقق من عدم وجود إنذار نشط بنفس المفتاح
    if (this.activeAlarms.has(params.alarmKey)) {
      return;
    }

    try {
      // إنشاء الإنذار في قاعدة البيانات
      const alarm = await this.prisma.scadaAlarm.create({
        data: {
          deviceId: params.deviceId,
          dataPointId: params.dataPointId,
          alarmRuleId: params.ruleId,
          severity: params.severity,
          message: params.message,
          value: params.value,
          threshold: params.threshold,
          status: 'active',
          triggeredAt: new Date(),
        },
      });

      this.activeAlarms.set(params.alarmKey, alarm.id);

      // تسجيل الحدث
      await this.eventLogs.logAlarm(alarm.id, `تم تفعيل إنذار: ${params.message}`, {
        severity: params.severity,
        value: params.value,
        threshold: params.threshold,
      });

      // إرسال الإنذار عبر WebSocket
      this.eventEmitter.emit('alarm.triggered', {
        alarm,
        stationId: params.stationId,
        deviceId: params.deviceId,
      });

      this.logger.warn(`Alarm triggered: ${params.message}`);
    } catch (error) {
      this.logger.error(`Error triggering alarm: ${error.message}`);
    }
  }

  private async clearAlarmIfExists(alarmKey: string): Promise<void> {
    const alarmId = this.activeAlarms.get(alarmKey);
    if (!alarmId) return;

    try {
      // تحديث حالة الإنذار
      const alarm = await this.prisma.scadaAlarm.update({
        where: { id: alarmId },
        data: {
          status: 'cleared',
          clearedAt: new Date(),
        },
      });

      this.activeAlarms.delete(alarmKey);

      // تسجيل الحدث
      await this.eventLogs.logAlarm(alarmId, 'تم مسح الإنذار تلقائياً - عودة القيمة للنطاق الطبيعي');

      // إرسال إشعار المسح عبر WebSocket
      this.eventEmitter.emit('alarm.cleared', { alarm });

      this.logger.log(`Alarm cleared: ${alarmId}`);
    } catch (error) {
      this.logger.error(`Error clearing alarm: ${error.message}`);
    }
  }

  // إعادة تحميل القواعد
  async reloadRules(): Promise<void> {
    await this.loadRules();
  }

  // الحصول على الإنذارات النشطة
  getActiveAlarmKeys(): string[] {
    return Array.from(this.activeAlarms.keys());
  }

  // فحص قراءة يدوياً
  async manualCheck(dataPointId: string, value: number): Promise<{
    triggered: boolean;
    alarms: string[];
  }> {
    const dataPoint = await this.prisma.scadaDataPoint.findUnique({
      where: { id: dataPointId },
      include: {
        device: {
          include: {
            station: true,
          },
        },
      },
    });

    if (!dataPoint) {
      return { triggered: false, alarms: [] };
    }

    const alarms: string[] = [];

    // فحص الحدود المدمجة
    if (dataPoint.alarmHigh !== null && value >= Number(dataPoint.alarmHigh)) {
      alarms.push(`تجاوز الحد الأعلى الحرج (${dataPoint.alarmHigh})`);
    }
    if (dataPoint.warningHigh !== null && value >= Number(dataPoint.warningHigh)) {
      alarms.push(`تجاوز حد التحذير الأعلى (${dataPoint.warningHigh})`);
    }
    if (dataPoint.alarmLow !== null && value <= Number(dataPoint.alarmLow)) {
      alarms.push(`أقل من الحد الأدنى الحرج (${dataPoint.alarmLow})`);
    }
    if (dataPoint.warningLow !== null && value <= Number(dataPoint.warningLow)) {
      alarms.push(`أقل من حد التحذير الأدنى (${dataPoint.warningLow})`);
    }

    // فحص القواعد المخصصة
    const applicableRules = this.rules.filter(rule => {
      if (rule.dataPointId && rule.dataPointId !== dataPointId) return false;
      if (rule.deviceId && rule.deviceId !== dataPoint.deviceId) return false;
      if (rule.stationId && rule.stationId !== dataPoint.device.stationId) return false;
      return true;
    });

    for (const rule of applicableRules) {
      if (this.evaluateCondition(value, rule)) {
        alarms.push(`قاعدة: ${rule.name}`);
      }
    }

    return {
      triggered: alarms.length > 0,
      alarms,
    };
  }
}
