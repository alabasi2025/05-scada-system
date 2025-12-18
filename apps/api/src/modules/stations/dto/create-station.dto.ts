import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsUUID, IsEnum, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StationType {
  MAIN = 'main',
  SUBSTATION = 'substation',
  DISTRIBUTION = 'distribution',
  SOLAR = 'solar',
}

export enum VoltageLevel {
  HV = 'HV',
  MV = 'MV',
  LV = 'LV',
}

export enum StationStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

export class CreateStationDto {
  @ApiProperty({ description: 'رمز المحطة الفريد', example: 'ST-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({ description: 'اسم المحطة بالعربية', example: 'محطة الرياض الرئيسية' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'اسم المحطة بالإنجليزية', example: 'Riyadh Main Station' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @ApiProperty({ description: 'نوع المحطة', enum: StationType, example: StationType.MAIN })
  @IsEnum(StationType)
  @IsNotEmpty()
  type: StationType;

  @ApiPropertyOptional({ description: 'مستوى الجهد', enum: VoltageLevel, example: VoltageLevel.HV })
  @IsEnum(VoltageLevel)
  @IsOptional()
  voltageLevel?: VoltageLevel;

  @ApiPropertyOptional({ description: 'خط العرض', example: 24.7136 })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول', example: 46.6753 })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'العنوان', example: 'شارع الملك فهد، الرياض' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'السعة بالـ MVA', example: 100.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ description: 'معرف الأعمال', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  businessId?: string;
}

export class UpdateStationDto {
  @ApiPropertyOptional({ description: 'اسم المحطة بالعربية' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'اسم المحطة بالإنجليزية' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'نوع المحطة', enum: StationType })
  @IsEnum(StationType)
  @IsOptional()
  type?: StationType;

  @ApiPropertyOptional({ description: 'مستوى الجهد', enum: VoltageLevel })
  @IsEnum(VoltageLevel)
  @IsOptional()
  voltageLevel?: VoltageLevel;

  @ApiPropertyOptional({ description: 'خط العرض' })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول' })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'العنوان' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'السعة بالـ MVA' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ description: 'حالة المحطة', enum: StationStatus })
  @IsEnum(StationStatus)
  @IsOptional()
  status?: StationStatus;

  @ApiPropertyOptional({ description: 'هل المحطة نشطة' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
