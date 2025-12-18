import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsUUID, IsEnum, IsIP, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeviceType {
  TRANSFORMER = 'transformer',
  BREAKER = 'breaker',
  METER = 'meter',
  FEEDER = 'feeder',
  PANEL = 'panel',
}

export enum DeviceProtocol {
  MODBUS_TCP = 'modbus_tcp',
  MODBUS_RTU = 'modbus_rtu',
  MQTT = 'mqtt',
  HTTP = 'http',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

export class CreateDeviceDto {
  @ApiProperty({ description: 'معرف المحطة', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  stationId: string;

  @ApiProperty({ description: 'رمز الجهاز الفريد', example: 'DEV-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'اسم الجهاز', example: 'محول رئيسي 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'اسم الجهاز بالإنجليزية' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @ApiProperty({ description: 'نوع الجهاز', enum: DeviceType })
  @IsEnum(DeviceType)
  @IsNotEmpty()
  type: DeviceType;

  @ApiPropertyOptional({ description: 'الشركة المصنعة' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'الموديل' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ description: 'الرقم التسلسلي' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  serialNumber?: string;

  @ApiProperty({ description: 'بروتوكول الاتصال', enum: DeviceProtocol })
  @IsEnum(DeviceProtocol)
  @IsNotEmpty()
  protocol: DeviceProtocol;

  @ApiPropertyOptional({ description: 'عنوان IP' })
  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'رقم المنفذ' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional({ description: 'معرف Slave لـ Modbus' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(247)
  slaveId?: number;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional({ description: 'اسم الجهاز' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'اسم الجهاز بالإنجليزية' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'نوع الجهاز', enum: DeviceType })
  @IsEnum(DeviceType)
  @IsOptional()
  type?: DeviceType;

  @ApiPropertyOptional({ description: 'الشركة المصنعة' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'الموديل' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ description: 'بروتوكول الاتصال', enum: DeviceProtocol })
  @IsEnum(DeviceProtocol)
  @IsOptional()
  protocol?: DeviceProtocol;

  @ApiPropertyOptional({ description: 'عنوان IP' })
  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'رقم المنفذ' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional({ description: 'حالة الجهاز', enum: DeviceStatus })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  @ApiPropertyOptional({ description: 'هل الجهاز نشط' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
