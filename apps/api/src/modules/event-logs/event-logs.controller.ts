import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventLogsService } from './event-logs.service';
import { CreateEventLogDto, EventLogQueryDto, EventLogResponseDto, EntityType } from './dto';

@ApiTags('سجل الأحداث - Event Logs')
@Controller('event-logs')
export class EventLogsController {
  constructor(private readonly eventLogsService: EventLogsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء سجل حدث جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء السجل بنجاح', type: EventLogResponseDto })
  create(@Body() dto: CreateEventLogDto) {
    return this.eventLogsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب سجلات الأحداث' })
  @ApiResponse({ status: 200, description: 'قائمة سجلات الأحداث' })
  findAll(@Query() query: EventLogQueryDto) {
    return this.eventLogsService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات سجل الأحداث' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'إحصائيات الأحداث' })
  getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventLogsService.getStatistics(startDate, endDate);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'جلب سجلات كيان معين' })
  @ApiParam({ name: 'entityType', description: 'نوع الكيان', enum: EntityType })
  @ApiParam({ name: 'entityId', description: 'معرف الكيان' })
  @ApiQuery({ name: 'limit', required: false, description: 'عدد السجلات' })
  @ApiResponse({ status: 200, description: 'سجلات الكيان' })
  findByEntity(
    @Param('entityType') entityType: EntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('limit') limit?: number,
  ) {
    return this.eventLogsService.findByEntity(entityType, entityId, limit);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'حذف السجلات القديمة' })
  @ApiQuery({ name: 'daysToKeep', required: false, description: 'عدد الأيام للاحتفاظ بالسجلات', example: 90 })
  @ApiResponse({ status: 200, description: 'تم حذف السجلات القديمة' })
  cleanOldLogs(@Query('daysToKeep') daysToKeep?: number) {
    return this.eventLogsService.cleanOldLogs(daysToKeep);
  }
}
