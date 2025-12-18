import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto, SettingQueryDto, SettingResponseDto } from './dto';

@ApiTags('إعدادات النظام - Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء إعداد جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الإعداد بنجاح', type: SettingResponseDto })
  @ApiResponse({ status: 409, description: 'الإعداد موجود مسبقاً' })
  create(@Body() dto: CreateSettingDto) {
    return this.settingsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع الإعدادات' })
  @ApiResponse({ status: 200, description: 'قائمة الإعدادات' })
  findAll(@Query() query: SettingQueryDto) {
    return this.settingsService.findAll(query);
  }

  @Get('initialize')
  @ApiOperation({ summary: 'تهيئة الإعدادات الافتراضية' })
  @ApiResponse({ status: 200, description: 'تم تهيئة الإعدادات' })
  initializeDefaults() {
    return this.settingsService.initializeDefaults();
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'جلب إعدادات تصنيف معين' })
  @ApiParam({ name: 'category', description: 'تصنيف الإعدادات' })
  @ApiResponse({ status: 200, description: 'إعدادات التصنيف' })
  getByCategory(@Param('category') category: string) {
    return this.settingsService.getByCategory(category);
  }

  @Get(':key')
  @ApiOperation({ summary: 'جلب إعداد بالمفتاح' })
  @ApiParam({ name: 'key', description: 'مفتاح الإعداد' })
  @ApiResponse({ status: 200, description: 'تفاصيل الإعداد', type: SettingResponseDto })
  @ApiResponse({ status: 404, description: 'الإعداد غير موجود' })
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'تحديث إعداد' })
  @ApiParam({ name: 'key', description: 'مفتاح الإعداد' })
  @ApiResponse({ status: 200, description: 'تم تحديث الإعداد', type: SettingResponseDto })
  @ApiResponse({ status: 404, description: 'الإعداد غير موجود' })
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(key, dto);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'إنشاء أو تحديث إعداد' })
  @ApiResponse({ status: 200, description: 'تم حفظ الإعداد', type: SettingResponseDto })
  upsert(@Body() dto: CreateSettingDto) {
    return this.settingsService.upsert(dto);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'حذف إعداد' })
  @ApiParam({ name: 'key', description: 'مفتاح الإعداد' })
  @ApiResponse({ status: 200, description: 'تم حذف الإعداد' })
  @ApiResponse({ status: 404, description: 'الإعداد غير موجود' })
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
