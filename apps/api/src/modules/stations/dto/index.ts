import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum StationType {
  MAIN = 'main',
  SUB = 'sub',
  DISTRIBUTION = 'distribution',
  SOLAR = 'solar',
}

export enum StationVoltage {
  KV33 = '33kv',
  KV11 = '11kv',
  KV04 = '0.4kv',
}

export enum StationStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

export class CreateStationDto {
  @ApiProperty({ description: 'رمز المحطة الفريد', example: 'STN-001' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'اسم المحطة بالعربية', example: 'محطة الرياض الرئيسية' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'اسم المحطة بالإنجليزية', example: 'Riyadh Main Station' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({ description: 'نوع المحطة', enum: StationType, example: StationType.MAIN })
  @IsEnum(StationType)
  type: StationType;

  @ApiProperty({ description: 'جهد المحطة', enum: StationVoltage, example: StationVoltage.KV33 })
  @IsEnum(StationVoltage)
  voltage: StationVoltage;

  @ApiPropertyOptional({ description: 'سعة المحطة (MVA)', example: 100.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capacity?: number;

  @ApiPropertyOptional({ description: 'خط العرض', example: 24.7136 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول', example: 46.6753 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'العنوان', example: 'شارع الملك فهد، الرياض' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'تاريخ التشغيل', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  commissionDate?: string;

  @ApiPropertyOptional({ description: 'حالة المحطة', enum: StationStatus, default: StationStatus.ONLINE })
  @IsOptional()
  @IsEnum(StationStatus)
  status?: StationStatus;
}

export class UpdateStationDto extends PartialType(CreateStationDto) {}

export class StationQueryDto {
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

  @ApiPropertyOptional({ description: 'نوع المحطة', enum: StationType })
  @IsOptional()
  @IsEnum(StationType)
  type?: StationType;

  @ApiPropertyOptional({ description: 'حالة المحطة', enum: StationStatus })
  @IsOptional()
  @IsEnum(StationStatus)
  status?: StationStatus;

  @ApiPropertyOptional({ description: 'جهد المحطة', enum: StationVoltage })
  @IsOptional()
  @IsEnum(StationVoltage)
  voltage?: StationVoltage;

  @ApiPropertyOptional({ description: 'البحث بالاسم أو الرمز' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class StationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  nameEn?: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  voltage: string;

  @ApiPropertyOptional()
  capacity?: number;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  commissionDate?: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  lastSyncAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
