import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import {
  CreateConnectionDto,
  UpdateConnectionDto,
  ConnectionQueryDto,
  TestConnectionDto,
  ConnectionResponseDto,
  TestConnectionResponseDto,
} from './dto';

@ApiTags('إعدادات الاتصال - Connections')
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء إعدادات اتصال جديدة لمحطة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الاتصال بنجاح', type: ConnectionResponseDto })
  @ApiResponse({ status: 400, description: 'يوجد اتصال مسبق للمحطة' })
  create(@Body() dto: CreateConnectionDto) {
    return this.connectionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع إعدادات الاتصال' })
  @ApiResponse({ status: 200, description: 'قائمة الاتصالات' })
  findAll(@Query() query: ConnectionQueryDto) {
    return this.connectionsService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات الاتصالات' })
  @ApiResponse({ status: 200, description: 'إحصائيات الاتصالات' })
  getStatistics() {
    return this.connectionsService.getStatistics();
  }

  @Get('enabled')
  @ApiOperation({ summary: 'جلب الاتصالات المفعلة مع تفاصيل المحطات والأجهزة' })
  @ApiResponse({ status: 200, description: 'قائمة الاتصالات المفعلة' })
  getEnabledConnections() {
    return this.connectionsService.getEnabledConnections();
  }

  @Get(':stationId')
  @ApiOperation({ summary: 'جلب إعدادات اتصال محطة' })
  @ApiParam({ name: 'stationId', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'تفاصيل الاتصال', type: ConnectionResponseDto })
  @ApiResponse({ status: 404, description: 'الاتصال غير موجود' })
  findByStationId(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.connectionsService.findByStationId(stationId);
  }

  @Put(':stationId')
  @ApiOperation({ summary: 'تحديث إعدادات اتصال محطة' })
  @ApiParam({ name: 'stationId', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'تم تحديث الاتصال', type: ConnectionResponseDto })
  @ApiResponse({ status: 404, description: 'الاتصال غير موجود' })
  update(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Body() dto: UpdateConnectionDto,
  ) {
    return this.connectionsService.update(stationId, dto);
  }

  @Post(':stationId/test')
  @ApiOperation({ summary: 'اختبار اتصال محطة' })
  @ApiParam({ name: 'stationId', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'نتيجة الاختبار', type: TestConnectionResponseDto })
  @ApiResponse({ status: 404, description: 'الاتصال غير موجود' })
  testConnection(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Body() dto: TestConnectionDto,
  ) {
    return this.connectionsService.testConnection(stationId, dto);
  }

  @Delete(':stationId')
  @ApiOperation({ summary: 'حذف إعدادات اتصال محطة' })
  @ApiParam({ name: 'stationId', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'تم حذف الاتصال' })
  @ApiResponse({ status: 404, description: 'الاتصال غير موجود' })
  remove(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.connectionsService.remove(stationId);
  }
}
