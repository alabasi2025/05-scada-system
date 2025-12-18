import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum DeviceType {
  TRANSFORMER = 'transformer',
  BREAKER = 'breaker',
  METER = 'meter',
  FEEDER = 'feeder',
  PANEL = 'panel',
}

export enum DeviceStatus {
  ACTIVE = 'active',
  FAULTY = 'faulty',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export class CreateDeviceDto {
  @ApiProperty({ description: 'معرف المحطة' })
  @IsUUID()
  stationId: string;

  @ApiProperty({ description: 'رمز الجهاز الفريد', example: 'DEV-001' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'اسم الجهاز', example: 'محول رئيسي 1' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'نوع الجهاز', enum: DeviceType, example: DeviceType.TRANSFORMER })
  @IsEnum(DeviceType)
  type: DeviceType;

  @ApiPropertyOptional({ description: 'الشركة المصنعة', example: 'ABB' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'الموديل', example: 'TX-500' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'الرقم التسلسلي', example: 'SN123456789' })
  @IsOptional()
  @IsString()
  serialNo?: string;

  @ApiPropertyOptional({ description: 'السعة المقدرة', example: 500 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ratedCapacity?: number;

  @ApiPropertyOptional({ description: 'الجهد المقدر', example: 33 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ratedVoltage?: number;

  @ApiPropertyOptional({ description: 'التيار المقدر', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ratedCurrent?: number;

  @ApiPropertyOptional({ description: 'تاريخ التركيب', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  installDate?: string;

  @ApiPropertyOptional({ description: 'حالة الجهاز', enum: DeviceStatus, default: DeviceStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}

export class DeviceQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'نوع الجهاز', enum: DeviceType })
  @IsOptional()
  @IsEnum(DeviceType)
  type?: DeviceType;

  @ApiPropertyOptional({ description: 'حالة الجهاز', enum: DeviceStatus })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ description: 'البحث بالاسم أو الرمز' })
  @IsOptional()
  @IsString()
  search?: string;
}
