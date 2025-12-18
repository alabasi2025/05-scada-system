import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReadingQuality {
  GOOD = 'good',
  BAD = 'bad',
  UNCERTAIN = 'uncertain',
}

export class CreateReadingDto {
  @ApiProperty({ description: 'معرف الجهاز' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ description: 'معرف نقطة القياس' })
  @IsUUID()
  dataPointId: string;

  @ApiProperty({ description: 'القيمة', example: 220.5 })
  @IsNumber()
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ description: 'جودة القراءة', enum: ReadingQuality, default: ReadingQuality.GOOD })
  @IsOptional()
  @IsEnum(ReadingQuality)
  quality?: ReadingQuality;

  @ApiPropertyOptional({ description: 'وقت القراءة' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class CreateBulkReadingsDto {
  @ApiProperty({ description: 'قائمة القراءات', type: [CreateReadingDto] })
  readings: CreateReadingDto[];
}

export class ReadingQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @ApiPropertyOptional({ description: 'معرف الجهاز' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'معرف نقطة القياس' })
  @IsOptional()
  @IsUUID()
  dataPointId?: string;

  @ApiPropertyOptional({ description: 'تاريخ البداية' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ النهاية' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'جودة القراءة', enum: ReadingQuality })
  @IsOptional()
  @IsEnum(ReadingQuality)
  quality?: ReadingQuality;
}

export class HistoricalReadingQueryDto {
  @ApiProperty({ description: 'معرف الجهاز' })
  @IsUUID()
  deviceId: string;

  @ApiPropertyOptional({ description: 'معرف نقطة القياس' })
  @IsOptional()
  @IsUUID()
  dataPointId?: string;

  @ApiProperty({ description: 'تاريخ البداية' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'تاريخ النهاية' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'الفترة الزمنية (بالدقائق)', default: 60 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  interval?: number = 60;
}
