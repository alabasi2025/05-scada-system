import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AlarmsService } from './alarms.service';
import { CreateAlarmRuleDto, UpdateAlarmRuleDto, AlarmQueryDto, AcknowledgeAlarmDto, ClearAlarmDto } from './dto';

@ApiTags('التنبيهات')
@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  // ==================== التنبيهات ====================

  @Get()
  @ApiOperation({ summary: 'جلب جميع التنبيهات' })
  @ApiResponse({ status: 200, description: 'قائمة التنبيهات' })
  findAll(@Query() query: AlarmQueryDto) {
    return this.alarmsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'جلب التنبيهات النشطة' })
  @ApiResponse({ status: 200, description: 'التنبيهات النشطة' })
  findActive() {
    return this.alarmsService.findActive();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'جلب إحصائيات التنبيهات' })
  @ApiResponse({ status: 200, description: 'إحصائيات التنبيهات' })
  getStatistics() {
    return this.alarmsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب تنبيه محدد' })
  @ApiParam({ name: 'id', description: 'معرف التنبيه' })
  @ApiResponse({ status: 200, description: 'بيانات التنبيه' })
  @ApiResponse({ status: 404, description: 'التنبيه غير موجود' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.alarmsService.findOne(id);
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'الإقرار بتنبيه' })
  @ApiParam({ name: 'id', description: 'معرف التنبيه' })
  @ApiResponse({ status: 200, description: 'تم الإقرار بالتنبيه' })
  acknowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcknowledgeAlarmDto,
  ) {
    // في الإنتاج، يجب الحصول على userId من JWT
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.alarmsService.acknowledge(id, userId, dto);
  }

  @Post(':id/clear')
  @ApiOperation({ summary: 'إغلاق تنبيه' })
  @ApiParam({ name: 'id', description: 'معرف التنبيه' })
  @ApiResponse({ status: 200, description: 'تم إغلاق التنبيه' })
  clear(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClearAlarmDto,
  ) {
    return this.alarmsService.clear(id, dto);
  }
}

@ApiTags('قواعد التنبيه')
@Controller('alarm-rules')
export class AlarmRulesController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء قاعدة تنبيه جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء قاعدة التنبيه بنجاح' })
  create(@Body() createAlarmRuleDto: CreateAlarmRuleDto) {
    return this.alarmsService.createRule(createAlarmRuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع قواعد التنبيه' })
  @ApiResponse({ status: 200, description: 'قائمة قواعد التنبيه' })
  findAll() {
    return this.alarmsService.findAllRules();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب قاعدة تنبيه محددة' })
  @ApiParam({ name: 'id', description: 'معرف قاعدة التنبيه' })
  @ApiResponse({ status: 200, description: 'بيانات قاعدة التنبيه' })
  @ApiResponse({ status: 404, description: 'قاعدة التنبيه غير موجودة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.alarmsService.findOneRule(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث قاعدة تنبيه' })
  @ApiParam({ name: 'id', description: 'معرف قاعدة التنبيه' })
  @ApiResponse({ status: 200, description: 'تم تحديث قاعدة التنبيه بنجاح' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAlarmRuleDto: UpdateAlarmRuleDto,
  ) {
    return this.alarmsService.updateRule(id, updateAlarmRuleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف قاعدة تنبيه' })
  @ApiParam({ name: 'id', description: 'معرف قاعدة التنبيه' })
  @ApiResponse({ status: 204, description: 'تم حذف قاعدة التنبيه بنجاح' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.alarmsService.removeRule(id);
  }
}
