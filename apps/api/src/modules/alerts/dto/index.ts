import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty() @IsUUID() stationId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() pointId?: string;
  @ApiProperty() @IsString() alertCode: string;
  @ApiProperty() @IsString() alertType: string;
  @ApiProperty() @IsString() severity: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() message: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() value?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() threshold?: number;
}

export class AlertQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() stationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alertType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() severity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() page?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() limit?: number;
}
