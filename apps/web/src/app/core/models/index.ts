// Station Model
export interface Station {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: 'main' | 'substation' | 'distribution' | 'solar';
  voltageLevel: string;
  latitude?: string;
  longitude?: string;
  address?: string;
  capacity?: string;
  status: 'online' | 'offline' | 'maintenance' | 'warning';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    devices: number;
    monitoringPoints: number;
    alerts: number;
  };
}

// Device Model
export interface Device {
  id: string;
  stationId: string;
  code: string;
  name: string;
  nameEn?: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'fault';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  station?: Station;
  _count?: {
    monitoringPoints: number;
  };
}

// Monitoring Point Model
export interface MonitoringPoint {
  id: string;
  deviceId: string;
  code: string;
  name: string;
  nameEn?: string;
  dataType: 'analog' | 'digital' | 'counter' | 'string';
  unit?: string;
  minValue?: number;
  maxValue?: number;
  alarmHighHigh?: number;
  alarmHigh?: number;
  alarmLow?: number;
  alarmLowLow?: number;
  modbusAddress?: number;
  modbusRegisterType?: string;
  scaleFactor?: number;
  isActive: boolean;
  device?: Device;
}

// Alert Model
export interface Alert {
  id: string;
  stationId?: string;
  deviceId?: string;
  pointId?: string;
  alertNumber: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  message: string;
  value?: number;
  threshold?: number;
  status: 'active' | 'acknowledged' | 'cleared';
  occurredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  clearedAt?: string;
  station?: Station;
  device?: Device;
  point?: MonitoringPoint;
}

// Control Command Model
export interface ControlCommand {
  id: string;
  deviceId: string;
  commandType: string;
  targetValue?: string;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  executedAt?: string;
  result?: string;
  device?: Device;
}

// API Response Model
export interface ApiResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  total?: number;
  skip?: number;
  take?: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalStations: number;
  onlineStations: number;
  totalDevices: number;
  activeDevices: number;
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
}
