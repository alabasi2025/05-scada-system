import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StationType {
  MAIN = 'main',
  SUBSTATION = 'substation',
  DISTRIBUTION = 'distribution',
  SOLAR = 'solar'
}

export enum StationStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

export class CreateStationDto {
  @ApiProperty({ description: 'كود المحطة الفريد', example: 'STN-001' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'اسم المحطة بالعربية', example: 'محطة الرياض الرئيسية' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'اسم المحطة بالإنجليزية' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({ enum: StationType, description: 'نوع المحطة' })
  @IsEnum(StationType)
  type: StationType;

  @ApiPropertyOptional({ description: 'مستوى الجهد', example: 'HV' })
  @IsOptional()
  @IsString()
  voltageLevel?: string;

  @ApiPropertyOptional({ description: 'خط العرض' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'العنوان' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'السعة بـ MVA' })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ description: 'معرف المجموعة' })
  @IsOptional()
  @IsUUID()
  businessId?: string;
}

export class UpdateStationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ enum: StationType })
  @IsOptional()
  @IsEnum(StationType)
  type?: StationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  voltageLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ enum: StationStatus })
  @IsOptional()
  @IsEnum(StationStatus)
  status?: StationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StationQueryDto {
  @ApiPropertyOptional({ enum: StationType })
  @IsOptional()
  @IsEnum(StationType)
  type?: StationType;

  @ApiPropertyOptional({ enum: StationStatus })
  @IsOptional()
  @IsEnum(StationStatus)
  status?: StationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
