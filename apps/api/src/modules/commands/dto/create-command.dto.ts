import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CommandType {
  SWITCH_ON = 'switch_on',
  SWITCH_OFF = 'switch_off',
  RESET = 'reset',
  SET_VALUE = 'set_value',
  READ = 'read',
}

export enum CommandStatus {
  PENDING = 'pending',
  SENT = 'sent',
  EXECUTED = 'executed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

export class CreateCommandDto {
  @ApiProperty({ description: 'معرف المحطة' })
  @IsUUID()
  @IsNotEmpty()
  stationId: string;

  @ApiProperty({ description: 'معرف الجهاز' })
  @IsUUID()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'نوع الأمر', enum: CommandType })
  @IsEnum(CommandType)
  @IsNotEmpty()
  commandType: CommandType;

  @ApiPropertyOptional({ description: 'معاملات الأمر', example: { value: 100, unit: 'V' } })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'سبب الأمر' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'أولوية الأمر (1-10)' })
  @IsOptional()
  priority?: number;
}

export class UpdateCommandStatusDto {
  @ApiProperty({ description: 'حالة الأمر', enum: CommandStatus })
  @IsEnum(CommandStatus)
  @IsNotEmpty()
  status: CommandStatus;

  @ApiPropertyOptional({ description: 'نتيجة التنفيذ' })
  @IsObject()
  @IsOptional()
  result?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'رسالة الخطأ' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  errorMessage?: string;
}
