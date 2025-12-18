import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AlarmRulesService } from './alarm-rules.service';
import {
  CreateAlarmRuleDto,
  UpdateAlarmRuleDto,
  AlarmRuleQueryDto,
  AlarmRuleResponseDto,
} from './dto';

@ApiTags('قواعد التنبيه - Alarm Rules')
@Controller('alarm-rules')
export class AlarmRulesController {
  constructor(private readonly alarmRulesService: AlarmRulesService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء قاعدة تنبيه جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء القاعدة بنجاح', type: AlarmRuleResponseDto })
  create(@Body() dto: CreateAlarmRuleDto) {
    return this.alarmRulesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع قواعد التنبيه' })
  @ApiResponse({ status: 200, description: 'قائمة قواعد التنبيه' })
  findAll(@Query() query: AlarmRuleQueryDto) {
    return this.alarmRulesService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات قواعد التنبيه' })
  @ApiResponse({ status: 200, description: 'إحصائيات القواعد' })
  getStatistics() {
    return this.alarmRulesService.getStatistics();
  }

  @Get('active')
  @ApiOperation({ summary: 'جلب القواعد المفعلة فقط' })
  @ApiResponse({ status: 200, description: 'قائمة القواعد المفعلة' })
  getActiveRules() {
    return this.alarmRulesService.getActiveRules();
  }

  @Get('data-point/:dataPointId')
  @ApiOperation({ summary: 'جلب قواعد التنبيه لنقطة قياس معينة' })
  @ApiParam({ name: 'dataPointId', description: 'معرف نقطة القياس' })
  @ApiResponse({ status: 200, description: 'قواعد التنبيه لنقطة القياس' })
  getRulesForDataPoint(@Param('dataPointId', ParseUUIDPipe) dataPointId: string) {
    return this.alarmRulesService.getRulesForDataPoint(dataPointId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب قاعدة تنبيه بالمعرف' })
  @ApiParam({ name: 'id', description: 'معرف القاعدة' })
  @ApiResponse({ status: 200, description: 'تفاصيل القاعدة', type: AlarmRuleResponseDto })
  @ApiResponse({ status: 404, description: 'القاعدة غير موجودة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.alarmRulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تحديث قاعدة تنبيه' })
  @ApiParam({ name: 'id', description: 'معرف القاعدة' })
  @ApiResponse({ status: 200, description: 'تم تحديث القاعدة', type: AlarmRuleResponseDto })
  @ApiResponse({ status: 404, description: 'القاعدة غير موجودة' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlarmRuleDto,
  ) {
    return this.alarmRulesService.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'تفعيل/تعطيل قاعدة تنبيه' })
  @ApiParam({ name: 'id', description: 'معرف القاعدة' })
  @ApiResponse({ status: 200, description: 'تم تغيير حالة القاعدة' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.alarmRulesService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف قاعدة تنبيه' })
  @ApiParam({ name: 'id', description: 'معرف القاعدة' })
  @ApiResponse({ status: 200, description: 'تم حذف القاعدة' })
  @ApiResponse({ status: 404, description: 'القاعدة غير موجودة' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.alarmRulesService.remove(id);
  }
}
