import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum AggregationType {
  HOURLY = 'hourly',
  DAILY = 'daily',
}

export class ReadingsAggregatedQueryDto {
  @ApiPropertyOptional({ description: 'معرف الجهاز' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'معرف نقطة القياس' })
  @IsOptional()
  @IsUUID()
  dataPointId?: string;

  @ApiProperty({ description: 'تاريخ البداية', example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'تاريخ النهاية', example: '2025-01-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class AggregateReadingsDto {
  @ApiProperty({ description: 'معرف الجهاز' })
  @IsUUID()
  deviceId: string;

  @ApiPropertyOptional({ description: 'معرف نقطة القياس (اختياري - إذا لم يحدد سيتم تجميع جميع النقاط)' })
  @IsOptional()
  @IsUUID()
  dataPointId?: string;

  @ApiProperty({ description: 'تاريخ البداية', example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'تاريخ النهاية', example: '2025-01-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'نوع التجميع', enum: AggregationType })
  @IsEnum(AggregationType)
  type: AggregationType;
}

export class ReadingHourlyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  dataPointId: string;

  @ApiProperty()
  hour: Date;

  @ApiProperty()
  minValue: number;

  @ApiProperty()
  maxValue: number;

  @ApiProperty()
  avgValue: number;

  @ApiPropertyOptional()
  sumValue?: number;

  @ApiProperty()
  readingCount: number;
}

export class ReadingDailyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  dataPointId: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  minValue: number;

  @ApiProperty()
  maxValue: number;

  @ApiProperty()
  avgValue: number;

  @ApiPropertyOptional()
  sumValue?: number;

  @ApiProperty()
  readingCount: number;
}

export class AggregationResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  recordsCreated: number;

  @ApiProperty()
  recordsUpdated: number;
}
