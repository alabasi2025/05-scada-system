import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  CLEARED = 'cleared',
}

export enum AlertType {
  THRESHOLD = 'threshold',
  COMMUNICATION = 'communication',
  SYSTEM = 'system',
  MANUAL = 'manual',
}

export class CreateAlertDto {
  @ApiProperty({ description: 'معرف المحطة' })
  @IsUUID()
  @IsNotEmpty()
  stationId: string;

  @ApiPropertyOptional({ description: 'معرف نقطة المراقبة' })
  @IsUUID()
  @IsOptional()
  pointId?: string;

  @ApiPropertyOptional({ description: 'معرف قاعدة التنبيه' })
  @IsUUID()
  @IsOptional()
  ruleId?: string;

  @ApiProperty({ description: 'نوع التنبيه', enum: AlertType })
  @IsEnum(AlertType)
  @IsNotEmpty()
  alertType: AlertType;

  @ApiProperty({ description: 'درجة الخطورة', enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  @IsNotEmpty()
  severity: AlertSeverity;

  @ApiProperty({ description: 'رسالة التنبيه', example: 'تجاوز الجهد الحد الأقصى' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;

  @ApiPropertyOptional({ description: 'القيمة المسجلة' })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ description: 'قيمة العتبة' })
  @IsNumber()
  @IsOptional()
  threshold?: number;
}

export class UpdateAlertDto {
  @ApiPropertyOptional({ description: 'حالة التنبيه', enum: AlertStatus })
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @ApiPropertyOptional({ description: 'ملاحظات الإقرار' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  acknowledgeNotes?: string;

  @ApiPropertyOptional({ description: 'ملاحظات الحل' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  resolveNotes?: string;
}

export class AcknowledgeAlertDto {
  @ApiPropertyOptional({ description: 'ملاحظات الإقرار' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
