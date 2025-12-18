import { IsString, IsOptional, IsNumber, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommandDto {
  @ApiProperty() @IsUUID() stationId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() deviceId?: string;
  @ApiProperty() @IsString() commandType: string;
  @ApiProperty() @IsString() commandCode: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() parameters?: any;
  @ApiProperty() @IsString() requestedBy: string;
}

export class CommandQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() stationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() page?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() limit?: number;
}
