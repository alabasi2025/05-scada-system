import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum CommandType {
  OPEN = 'open',
  CLOSE = 'close',
  RESET = 'reset',
  SETPOINT = 'setpoint',
}

export enum CommandStatus {
  PENDING = 'pending',
  SENT = 'sent',
  EXECUTED = 'executed',
  FAILED = 'failed',
  REJECTED = 'rejected',
}

export class CreateCommandDto {
  @ApiProperty({ description: 'معرف الجهاز' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ description: 'نوع الأمر', enum: CommandType })
  @IsEnum(CommandType)
  commandType: CommandType;

  @ApiPropertyOptional({ description: 'القيمة المستهدفة (للأوامر setpoint)' })
  @IsOptional()
  @IsString()
  targetValue?: string;

  @ApiPropertyOptional({ description: 'سبب الأمر' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveCommandDto {
  @ApiPropertyOptional({ description: 'ملاحظات الموافقة' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectCommandDto {
  @ApiProperty({ description: 'سبب الرفض' })
  @IsString()
  reason: string;
}

export class CommandQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'معرف الجهاز' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'حالة الأمر', enum: CommandStatus })
  @IsOptional()
  @IsEnum(CommandStatus)
  status?: CommandStatus;

  @ApiPropertyOptional({ description: 'نوع الأمر', enum: CommandType })
  @IsOptional()
  @IsEnum(CommandType)
  commandType?: CommandType;

  @ApiPropertyOptional({ description: 'تاريخ البداية' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ النهاية' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
