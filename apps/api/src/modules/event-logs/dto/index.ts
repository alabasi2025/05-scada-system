import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum EventType {
  READING = 'READING',
  ALARM = 'ALARM',
  COMMAND = 'COMMAND',
  CONNECTION = 'CONNECTION',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
}

export enum EntityType {
  STATION = 'station',
  DEVICE = 'device',
  ALARM = 'alarm',
  COMMAND = 'command',
  CONNECTION = 'connection',
  USER = 'user',
}

export class CreateEventLogDto {
  @ApiProperty({ description: 'نوع الحدث', enum: EventType })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({ description: 'نوع الكيان', enum: EntityType })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiPropertyOptional({ description: 'معرف الكيان' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({ description: 'وصف الحدث' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'تفاصيل إضافية (JSON)' })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @ApiPropertyOptional({ description: 'معرف المستخدم' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'عنوان IP' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class EventLogQueryDto {
  @ApiPropertyOptional({ description: 'نوع الحدث', enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiPropertyOptional({ description: 'نوع الكيان', enum: EntityType })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @ApiPropertyOptional({ description: 'معرف الكيان' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'معرف المستخدم' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'تاريخ البداية' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ النهاية' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class EventLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: EventType })
  eventType: EventType;

  @ApiProperty({ enum: EntityType })
  entityType: EntityType;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  details?: Record<string, any>;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiProperty()
  createdAt: Date;
}
