import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMonitoringPointDto {
  @ApiProperty() @IsString() pointCode: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsUUID() stationId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() deviceId?: string;
  @ApiProperty() @IsString() pointType: string;
  @ApiProperty() @IsString() dataType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() minValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() warningLow?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() warningHigh?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() alarmLow?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() alarmHigh?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() modbusAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() scanInterval?: number;
}

export class UpdateMonitoringPointDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() warningLow?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() warningHigh?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() alarmLow?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() alarmHigh?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class MonitoringPointQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() stationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() deviceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pointType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dataType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() page?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() limit?: number;
}
