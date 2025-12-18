// ==================== المحطات ====================
export interface Station {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: StationType;
  voltage: StationVoltage;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  commissionDate?: Date;
  status: StationStatus;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    devices: number;
    alarms: number;
  };
}

export type StationType = 'main' | 'sub' | 'distribution' | 'solar';
export type StationVoltage = '33kv' | '11kv' | '0.4kv';
export type StationStatus = 'online' | 'offline' | 'maintenance';

// ==================== الأجهزة ====================
export interface Device {
  id: string;
  stationId: string;
  code: string;
  name: string;
  type: DeviceType;
  manufacturer?: string;
  model?: string;
  serialNo?: string;
  ratedCapacity?: number;
  ratedVoltage?: number;
  ratedCurrent?: number;
  installDate?: Date;
  status: DeviceStatus;
  lastReadingAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  station?: { code: string; name: string };
  _count?: {
    dataPoints: number;
    readings: number;
    alarms: number;
  };
}

export type DeviceType = 'transformer' | 'breaker' | 'meter' | 'feeder' | 'panel';
export type DeviceStatus = 'active' | 'faulty' | 'maintenance' | 'inactive';

// ==================== نقاط القياس ====================
export interface DataPoint {
  id: string;
  deviceId: string;
  code: string;
  name: string;
  unit: string;
  dataType: DataPointType;
  minValue?: number;
  maxValue?: number;
  warningLow?: number;
  warningHigh?: number;
  alarmLow?: number;
  alarmHigh?: number;
  scaleFactor?: number;
  modbusAddress?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  device?: { code: string; name: string };
}

export type DataPointType = 'analog' | 'digital' | 'counter';

// ==================== القراءات ====================
export interface Reading {
  id: string;
  deviceId: string;
  dataPointId: string;
  value: number;
  quality: ReadingQuality;
  timestamp: Date;
  device?: { code: string; name: string };
  dataPoint?: { code: string; name: string; unit: string };
}

export type ReadingQuality = 'good' | 'bad' | 'uncertain';

export interface LiveReading {
  dataPoint: DataPoint;
  reading?: Reading;
}

// ==================== التنبيهات ====================
export interface Alarm {
  id: string;
  alarmNo: string;
  stationId: string;
  deviceId?: string;
  dataPointId?: string;
  severity: AlarmSeverity;
  message: string;
  value?: number;
  threshold?: number;
  status: AlarmStatus;
  triggeredAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  clearedAt?: Date;
  notes?: string;
  station?: { code: string; name: string };
  device?: { code: string; name: string };
  dataPoint?: { code: string; name: string; unit: string };
}

export type AlarmSeverity = 'critical' | 'major' | 'minor' | 'warning';
export type AlarmStatus = 'active' | 'acknowledged' | 'cleared';

// ==================== أوامر التحكم ====================
export interface Command {
  id: string;
  commandNo: string;
  deviceId: string;
  commandType: CommandType;
  targetValue?: string;
  reason?: string;
  status: CommandStatus;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  executedAt?: Date;
  response?: string;
  device?: {
    code: string;
    name: string;
    station?: { code: string; name: string };
  };
}

export type CommandType = 'open' | 'close' | 'reset' | 'setpoint';
export type CommandStatus = 'pending' | 'sent' | 'executed' | 'failed' | 'rejected';

// ==================== الاستجابات ====================
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Statistics {
  total: number;
  byType?: Record<string, number>;
  byStatus?: Record<string, number>;
  bySeverity?: Record<string, number>;
}

// ==================== WebSocket ====================
export interface WsMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
}
