import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum DataPointType {
  ANALOG = 'analog',
  DIGITAL = 'digital',
  COUNTER = 'counter',
}

export enum DataPointUnit {
  VOLT = 'V',
  AMPERE = 'A',
  KILOWATT = 'kW',
  KILOWATT_HOUR = 'kWh',
  HERTZ = 'Hz',
  POWER_FACTOR = 'PF',
  CELSIUS = '°C',
  PERCENT = '%',
}

export class CreateDataPointDto {
  @ApiProperty({ description: 'معرف الجهاز' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ description: 'رمز نقطة القياس', example: 'V_A' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'اسم نقطة القياس', example: 'جهد الطور A' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'وحدة القياس', example: 'V' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'نوع البيانات', enum: DataPointType, example: DataPointType.ANALOG })
  @IsEnum(DataPointType)
  dataType: DataPointType;

  @ApiPropertyOptional({ description: 'الحد الأدنى للقيمة', example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minValue?: number;

  @ApiPropertyOptional({ description: 'الحد الأقصى للقيمة', example: 500 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxValue?: number;

  @ApiPropertyOptional({ description: 'حد التحذير الأدنى', example: 200 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  warningLow?: number;

  @ApiPropertyOptional({ description: 'حد التحذير الأعلى', example: 250 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  warningHigh?: number;

  @ApiPropertyOptional({ description: 'حد الإنذار الأدنى', example: 180 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  alarmLow?: number;

  @ApiPropertyOptional({ description: 'حد الإنذار الأعلى', example: 270 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  alarmHigh?: number;

  @ApiPropertyOptional({ description: 'معامل التحويل', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  scaleFactor?: number;

  @ApiPropertyOptional({ description: 'عنوان Modbus', example: 100 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  modbusAddress?: number;

  @ApiPropertyOptional({ description: 'نشط', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDataPointDto extends PartialType(CreateDataPointDto) {}

export class DataPointQueryDto {
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

  @ApiPropertyOptional({ description: 'معرف الجهاز' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'نوع البيانات', enum: DataPointType })
  @IsOptional()
  @IsEnum(DataPointType)
  dataType?: DataPointType;

  @ApiPropertyOptional({ description: 'نشط فقط' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'البحث بالاسم أو الرمز' })
  @IsOptional()
  @IsString()
  search?: string;
}
