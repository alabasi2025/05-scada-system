import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CommandExecutorService } from './command-executor.service';

class CreateCommandDto {
  deviceId: string;
  dataPointId?: string;
  commandType: string;
  commandValue: any;
  requestedBy: string;
  reason?: string;
  priority?: string;
}

class ApproveCommandDto {
  approvedBy: string;
  approverRole: string;
}

class RejectCommandDto {
  rejectedBy: string;
  reason: string;
}

@ApiTags('Command Executor')
@Controller('command-executor')
export class CommandExecutorController {
  constructor(private readonly commandExecutorService: CommandExecutorService) {}

  @Post('commands')
  @ApiOperation({ summary: 'إنشاء أمر تحكم جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الأمر بنجاح' })
  async createCommand(@Body() dto: CreateCommandDto) {
    return this.commandExecutorService.createCommand(dto);
  }

  @Post('commands/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'الموافقة على أمر' })
  @ApiResponse({ status: 200, description: 'تمت الموافقة بنجاح' })
  async approveCommand(
    @Param('id') id: string,
    @Body() dto: ApproveCommandDto,
  ) {
    return this.commandExecutorService.approveCommand(
      id,
      dto.approvedBy,
      dto.approverRole,
    );
  }

  @Post('commands/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'رفض أمر' })
  @ApiResponse({ status: 200, description: 'تم الرفض بنجاح' })
  async rejectCommand(
    @Param('id') id: string,
    @Body() dto: RejectCommandDto,
  ) {
    return this.commandExecutorService.rejectCommand(
      id,
      dto.rejectedBy,
      dto.reason,
    );
  }

  @Post('commands/:id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تنفيذ أمر' })
  @ApiResponse({ status: 200, description: 'تم التنفيذ بنجاح' })
  async executeCommand(@Param('id') id: string) {
    return this.commandExecutorService.executeCommand(id);
  }

  @Get('pending-approvals')
  @ApiOperation({ summary: 'الحصول على الأوامر المعلقة للموافقة' })
  @ApiResponse({ status: 200, description: 'قائمة الأوامر المعلقة' })
  async getPendingApprovals() {
    return this.commandExecutorService.getPendingApprovals();
  }

  @Get('history')
  @ApiOperation({ summary: 'الحصول على سجل الأوامر' })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiQuery({ name: 'stationId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'سجل الأوامر' })
  async getCommandHistory(
    @Query('deviceId') deviceId?: string,
    @Query('stationId') stationId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commandExecutorService.getCommandHistory({
      deviceId,
      stationId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
