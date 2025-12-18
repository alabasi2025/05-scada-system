import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum AlarmCondition {
  GT = 'gt',           // أكبر من
  LT = 'lt',           // أصغر من
  EQ = 'eq',           // يساوي
  NE = 'ne',           // لا يساوي
  BETWEEN = 'between', // بين قيمتين
  OUTSIDE = 'outside', // خارج نطاق
}

export enum AlarmSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  WARNING = 'warning',
}

export class CreateAlarmRuleDto {
  @ApiProperty({ description: 'اسم القاعدة', example: 'تجاوز الجهد الحد الأعلى' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'وصف القاعدة' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'معرف نقطة القياس' })
  @IsOptional()
  @IsUUID()
  dataPointId?: string;

  @ApiPropertyOptional({ description: 'معرف الجهاز' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiProperty({ description: 'شرط التنبيه', enum: AlarmCondition, example: AlarmCondition.GT })
  @IsEnum(AlarmCondition)
  condition: AlarmCondition;

  @ApiProperty({ description: 'الحد الأول', example: 240 })
  @IsNumber()
  @Type(() => Number)
  threshold1: number;

  @ApiPropertyOptional({ description: 'الحد الثاني (للشروط between و outside)', example: 260 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  threshold2?: number;

  @ApiProperty({ description: 'مستوى الخطورة', enum: AlarmSeverity, example: AlarmSeverity.CRITICAL })
  @IsEnum(AlarmSeverity)
  severity: AlarmSeverity;

  @ApiPropertyOptional({ description: 'هل القاعدة مفعلة', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAlarmRuleDto extends PartialType(CreateAlarmRuleDto) {}

export class AlarmRuleQueryDto {
  @ApiPropertyOptional({ description: 'معرف نقطة القياس' })
  @IsOptional()
  @IsUUID()
  dataPointId?: string;

  @ApiPropertyOptional({ description: 'معرف الجهاز' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'مستوى الخطورة', enum: AlarmSeverity })
  @IsOptional()
  @IsEnum(AlarmSeverity)
  severity?: AlarmSeverity;

  @ApiPropertyOptional({ description: 'هل القاعدة مفعلة' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class AlarmRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  dataPointId?: string;

  @ApiPropertyOptional()
  deviceId?: string;

  @ApiPropertyOptional()
  stationId?: string;

  @ApiProperty({ enum: AlarmCondition })
  condition: AlarmCondition;

  @ApiProperty()
  threshold1: number;

  @ApiPropertyOptional()
  threshold2?: number;

  @ApiProperty({ enum: AlarmSeverity })
  severity: AlarmSeverity;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
