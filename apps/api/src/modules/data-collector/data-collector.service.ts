import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ModbusClientService, ModbusConnectionConfig } from './modbus-client.service';
import { ConnectionsService } from '../connections/connections.service';
import { EventLogsService } from '../event-logs/event-logs.service';
import { EventType, EntityType } from '../event-logs/dto';

interface DataPointConfig {
  id: string;
  name: string;
  modbusAddress: number;
  modbusRegisterType: string;
  scaleFactor: number;
  offset: number;
  unit: string;
}

interface CollectionResult {
  stationId: string;
  deviceId: string;
  dataPointId: string;
  value: number;
  rawValue: number;
  quality: string;
  timestamp: Date;
}

@Injectable()
export class DataCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DataCollectorService.name);
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private pollIntervalMs = 5000; // 5 seconds default

  constructor(
    private prisma: PrismaService,
    private modbusClient: ModbusClientService,
    private connectionsService: ConnectionsService,
    private eventLogs: EventLogsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('Data Collector Service initialized');
    // بدء جمع البيانات تلقائياً
    await this.startCollection();
  }

  async onModuleDestroy() {
    await this.stopCollection();
    await this.modbusClient.disconnectAll();
  }

  async startCollection(): Promise<void> {
    if (this.isCollecting) {
      this.logger.warn('Data collection is already running');
      return;
    }

    this.isCollecting = true;
    this.logger.log('Starting data collection...');

    // الاتصال بجميع المحطات المفعلة
    await this.connectToAllStations();

    // بدء جمع البيانات الدوري
    this.collectionInterval = setInterval(async () => {
      await this.collectAllData();
    }, this.pollIntervalMs);

    await this.eventLogs.logSystem('بدء خدمة جمع البيانات', {
      pollInterval: this.pollIntervalMs,
    });
  }

  async stopCollection(): Promise<void> {
    if (!this.isCollecting) {
      return;
    }

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.logger.log('Data collection stopped');

    await this.eventLogs.logSystem('إيقاف خدمة جمع البيانات');
  }

  private async connectToAllStations(): Promise<void> {
    try {
      const connections = await this.connectionsService.getEnabledConnections();

      for (const connection of connections) {
        if (connection.protocol === 'modbus_tcp' || connection.protocol === 'modbus_rtu') {
          const config: ModbusConnectionConfig = {
            protocol: connection.protocol as 'modbus_tcp' | 'modbus_rtu',
            ipAddress: connection.ipAddress || undefined,
            port: connection.port || undefined,
            slaveId: connection.slaveId || 1,
            comPort: connection.comPort || undefined,
            baudRate: connection.baudRate || undefined,
            timeout: connection.timeout || 3000,
          };

          const connected = await this.modbusClient.connect(connection.stationId, config);

          if (connected) {
            await this.connectionsService.updateStatus(connection.stationId, 'connected' as any);
            this.logger.log(`Connected to station ${connection.station.code}`);
          } else {
            await this.connectionsService.updateStatus(connection.stationId, 'error' as any);
            this.logger.error(`Failed to connect to station ${connection.station.code}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error connecting to stations: ${error.message}`);
    }
  }

  private async collectAllData(): Promise<void> {
    try {
      const connections = await this.connectionsService.getEnabledConnections();

      for (const connection of connections) {
        if (!this.modbusClient.isConnected(connection.stationId)) {
          // محاولة إعادة الاتصال
          const config: ModbusConnectionConfig = {
            protocol: connection.protocol as 'modbus_tcp' | 'modbus_rtu',
            ipAddress: connection.ipAddress || undefined,
            port: connection.port || undefined,
            slaveId: connection.slaveId || 1,
            comPort: connection.comPort || undefined,
            baudRate: connection.baudRate || undefined,
            timeout: connection.timeout || 3000,
          };
          await this.modbusClient.connect(connection.stationId, config);
        }

        // جمع البيانات من كل جهاز في المحطة
        for (const device of connection.station.devices) {
          await this.collectDeviceData(connection.stationId, device);
        }
      }
    } catch (error) {
      this.logger.error(`Error in data collection cycle: ${error.message}`);
    }
  }

  private async collectDeviceData(stationId: string, device: any): Promise<void> {
    const results: CollectionResult[] = [];

    for (const dataPoint of device.dataPoints) {
      if (!dataPoint.isActive) continue;

      try {
        const result = await this.readDataPoint(stationId, dataPoint);
        if (result) {
          results.push({
            stationId,
            deviceId: device.id,
            dataPointId: dataPoint.id,
            value: result.value,
            rawValue: result.rawValue,
            quality: result.quality,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        this.logger.error(`Error reading data point ${dataPoint.name}: ${error.message}`);
      }
    }

    // حفظ القراءات في قاعدة البيانات
    if (results.length > 0) {
      await this.saveReadings(results);
      
      // إرسال البيانات عبر WebSocket
      this.eventEmitter.emit('readings.new', {
        stationId,
        deviceId: device.id,
        readings: results,
      });
    }
  }

  private async readDataPoint(
    stationId: string,
    dataPoint: DataPointConfig,
  ): Promise<{ value: number; rawValue: number; quality: string } | null> {
    const address = dataPoint.modbusAddress;
    const registerType = dataPoint.modbusRegisterType || 'holding';

    let result;
    switch (registerType) {
      case 'holding':
        result = await this.modbusClient.readHoldingRegisters(stationId, address, 1);
        break;
      case 'input':
        result = await this.modbusClient.readInputRegisters(stationId, address, 1);
        break;
      case 'coil':
        result = await this.modbusClient.readCoils(stationId, address, 1);
        break;
      case 'discrete':
        result = await this.modbusClient.readDiscreteInputs(stationId, address, 1);
        break;
      default:
        result = await this.modbusClient.readHoldingRegisters(stationId, address, 1);
    }

    if (!result.success || !result.data) {
      return null;
    }

    const rawValue = result.data[0];
    const scaleFactor = dataPoint.scaleFactor || 1;
    const offset = dataPoint.offset || 0;
    const value = rawValue * scaleFactor + offset;

    return {
      value,
      rawValue,
      quality: 'good',
    };
  }

  private async saveReadings(results: CollectionResult[]): Promise<void> {
    try {
      await this.prisma.scadaReading.createMany({
        data: results.map(r => ({
          deviceId: r.deviceId,
          dataPointId: r.dataPointId,
          value: r.value,
          rawValue: r.rawValue,
          quality: r.quality,
          timestamp: r.timestamp,
        })),
      });
    } catch (error) {
      this.logger.error(`Error saving readings: ${error.message}`);
    }
  }

  // جمع البيانات يدوياً لمحطة معينة
  async collectStationData(stationId: string): Promise<CollectionResult[]> {
    const connection = await this.connectionsService.findByStationId(stationId);
    const results: CollectionResult[] = [];

    for (const device of connection.station.devices) {
      for (const dataPoint of (device as any).dataPoints || []) {
        if (!dataPoint.isActive) continue;

        try {
          const result = await this.readDataPoint(stationId, dataPoint);
          if (result) {
            results.push({
              stationId,
              deviceId: device.id,
              dataPointId: dataPoint.id,
              value: result.value,
              rawValue: result.rawValue,
              quality: result.quality,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          this.logger.error(`Error reading data point ${dataPoint.name}: ${error.message}`);
        }
      }
    }

    if (results.length > 0) {
      await this.saveReadings(results);
    }

    return results;
  }

  // إحصائيات جمع البيانات
  async getCollectionStatus(): Promise<{
    isCollecting: boolean;
    pollInterval: number;
    connectedStations: string[];
    lastCollectionTime?: Date;
  }> {
    return {
      isCollecting: this.isCollecting,
      pollInterval: this.pollIntervalMs,
      connectedStations: this.modbusClient.getConnectedClients(),
    };
  }

  // تغيير فترة الاستطلاع
  setPollInterval(intervalMs: number): void {
    this.pollIntervalMs = intervalMs;
    
    if (this.isCollecting && this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = setInterval(async () => {
        await this.collectAllData();
      }, this.pollIntervalMs);
    }

    this.logger.log(`Poll interval changed to ${intervalMs}ms`);
  }

  // تنظيف القراءات القديمة
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanOldReadings(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // الاحتفاظ بـ 30 يوم

    const result = await this.prisma.scadaReading.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned ${result.count} old readings`);
  }
}
