import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsBoolean, IsIP, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum ConnectionProtocol {
  MODBUS_TCP = 'modbus_tcp',
  MODBUS_RTU = 'modbus_rtu',
  IEC61850 = 'iec61850',
  DNP3 = 'dnp3',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  CONNECTING = 'connecting',
}

export class CreateConnectionDto {
  @ApiProperty({ description: 'معرف المحطة' })
  @IsUUID()
  stationId: string;

  @ApiProperty({ description: 'بروتوكول الاتصال', enum: ConnectionProtocol, example: ConnectionProtocol.MODBUS_TCP })
  @IsEnum(ConnectionProtocol)
  protocol: ConnectionProtocol;

  @ApiPropertyOptional({ description: 'عنوان IP', example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'رقم المنفذ', example: 502 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  port?: number;

  @ApiPropertyOptional({ description: 'معرف الجهاز (Slave ID)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(247)
  @Type(() => Number)
  slaveId?: number;

  @ApiPropertyOptional({ description: 'منفذ COM (للاتصال التسلسلي)', example: 'COM1' })
  @IsOptional()
  @IsString()
  comPort?: string;

  @ApiPropertyOptional({ description: 'سرعة الاتصال', example: 9600 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  baudRate?: number;

  @ApiPropertyOptional({ description: 'فترة الاستطلاع بالثواني', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3600)
  @Type(() => Number)
  pollInterval?: number;

  @ApiPropertyOptional({ description: 'مهلة الاتصال بالمللي ثانية', default: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(30000)
  @Type(() => Number)
  timeout?: number;

  @ApiPropertyOptional({ description: 'هل الاتصال مفعل', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateConnectionDto extends PartialType(CreateConnectionDto) {}

export class ConnectionQueryDto {
  @ApiPropertyOptional({ description: 'بروتوكول الاتصال', enum: ConnectionProtocol })
  @IsOptional()
  @IsEnum(ConnectionProtocol)
  protocol?: ConnectionProtocol;

  @ApiPropertyOptional({ description: 'حالة الاتصال', enum: ConnectionStatus })
  @IsOptional()
  @IsEnum(ConnectionStatus)
  connectionStatus?: ConnectionStatus;

  @ApiPropertyOptional({ description: 'هل الاتصال مفعل' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isEnabled?: boolean;
}

export class TestConnectionDto {
  @ApiPropertyOptional({ description: 'عنوان Modbus للاختبار', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  testAddress?: number;

  @ApiPropertyOptional({ description: 'عدد السجلات للقراءة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  registerCount?: number;
}

export class ConnectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  stationId: string;

  @ApiProperty({ enum: ConnectionProtocol })
  protocol: ConnectionProtocol;

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  port?: number;

  @ApiPropertyOptional()
  slaveId?: number;

  @ApiPropertyOptional()
  comPort?: string;

  @ApiPropertyOptional()
  baudRate?: number;

  @ApiProperty()
  pollInterval: number;

  @ApiProperty()
  timeout: number;

  @ApiProperty()
  isEnabled: boolean;

  @ApiPropertyOptional()
  lastConnectAt?: Date;

  @ApiProperty({ enum: ConnectionStatus })
  connectionStatus: ConnectionStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TestConnectionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  latency?: number;

  @ApiPropertyOptional()
  data?: number[];

  @ApiPropertyOptional()
  error?: string;
}
