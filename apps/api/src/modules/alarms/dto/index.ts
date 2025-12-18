import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum AlarmSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  WARNING = 'warning',
}

export enum AlarmStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  CLEARED = 'cleared',
}

export enum AlarmCondition {
  GT = 'gt',
  LT = 'lt',
  EQ = 'eq',
  NE = 'ne',
  BETWEEN = 'between',
  OUTSIDE = 'outside',
}

export class CreateAlarmRuleDto {
  @ApiProperty({ description: 'اسم قاعدة التنبيه', example: 'تجاوز الجهد' })
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

  @ApiProperty({ description: 'شرط التنبيه', enum: AlarmCondition })
  @IsEnum(AlarmCondition)
  condition: AlarmCondition;

  @ApiProperty({ description: 'الحد الأول', example: 250 })
  @IsNumber()
  @Type(() => Number)
  threshold1: number;

  @ApiPropertyOptional({ description: 'الحد الثاني (للشروط between و outside)', example: 270 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  threshold2?: number;

  @ApiProperty({ description: 'شدة التنبيه', enum: AlarmSeverity })
  @IsEnum(AlarmSeverity)
  severity: AlarmSeverity;
}

export class UpdateAlarmRuleDto extends PartialType(CreateAlarmRuleDto) {}

export class AlarmQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'معرف الجهاز' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'حالة التنبيه', enum: AlarmStatus })
  @IsOptional()
  @IsEnum(AlarmStatus)
  status?: AlarmStatus;

  @ApiPropertyOptional({ description: 'شدة التنبيه', enum: AlarmSeverity })
  @IsOptional()
  @IsEnum(AlarmSeverity)
  severity?: AlarmSeverity;

  @ApiPropertyOptional({ description: 'تاريخ البداية' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ النهاية' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AcknowledgeAlarmDto {
  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClearAlarmDto {
  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}
