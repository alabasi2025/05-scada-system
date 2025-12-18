import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

export enum SettingCategory {
  GENERAL = 'general',
  ALARM = 'alarm',
  NOTIFICATION = 'notification',
  MODBUS = 'modbus',
  DISPLAY = 'display',
}

export class CreateSettingDto {
  @ApiProperty({ description: 'مفتاح الإعداد', example: 'alarm.sound.enabled' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'قيمة الإعداد', example: 'true' })
  @IsString()
  value: string;

  @ApiProperty({ description: 'نوع القيمة', enum: SettingType })
  @IsEnum(SettingType)
  type: SettingType;

  @ApiProperty({ description: 'تصنيف الإعداد', enum: SettingCategory })
  @IsEnum(SettingCategory)
  category: SettingCategory;
}

export class UpdateSettingDto {
  @ApiProperty({ description: 'قيمة الإعداد' })
  @IsString()
  value: string;
}

export class SettingQueryDto {
  @ApiPropertyOptional({ description: 'تصنيف الإعداد', enum: SettingCategory })
  @IsOptional()
  @IsEnum(SettingCategory)
  category?: SettingCategory;
}

export class SettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;

  @ApiProperty({ enum: SettingType })
  type: SettingType;

  @ApiProperty({ enum: SettingCategory })
  category: SettingCategory;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
