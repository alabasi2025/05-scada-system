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
  ApiQuery,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceQueryDto } from './dto';

@ApiTags('الأجهزة والمعدات')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء جهاز جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الجهاز بنجاح' })
  @ApiResponse({ status: 409, description: 'الجهاز موجود مسبقاً' })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع الأجهزة' })
  @ApiResponse({ status: 200, description: 'قائمة الأجهزة' })
  findAll(@Query() query: DeviceQueryDto) {
    return this.devicesService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'جلب إحصائيات الأجهزة' })
  @ApiResponse({ status: 200, description: 'إحصائيات الأجهزة' })
  getStatistics() {
    return this.devicesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب جهاز محدد' })
  @ApiParam({ name: 'id', description: 'معرف الجهاز' })
  @ApiResponse({ status: 200, description: 'بيانات الجهاز' })
  @ApiResponse({ status: 404, description: 'الجهاز غير موجود' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.devicesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث جهاز' })
  @ApiParam({ name: 'id', description: 'معرف الجهاز' })
  @ApiResponse({ status: 200, description: 'تم تحديث الجهاز بنجاح' })
  @ApiResponse({ status: 404, description: 'الجهاز غير موجود' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف جهاز' })
  @ApiParam({ name: 'id', description: 'معرف الجهاز' })
  @ApiResponse({ status: 204, description: 'تم حذف الجهاز بنجاح' })
  @ApiResponse({ status: 404, description: 'الجهاز غير موجود' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.devicesService.remove(id);
  }

  @Get(':id/readings')
  @ApiOperation({ summary: 'جلب قراءات الجهاز' })
  @ApiParam({ name: 'id', description: 'معرف الجهاز' })
  @ApiQuery({ name: 'startDate', required: false, description: 'تاريخ البداية' })
  @ApiQuery({ name: 'endDate', required: false, description: 'تاريخ النهاية' })
  @ApiQuery({ name: 'limit', required: false, description: 'عدد القراءات' })
  @ApiResponse({ status: 200, description: 'قراءات الجهاز' })
  getReadings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.devicesService.getReadings(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Get(':id/data-points')
  @ApiOperation({ summary: 'جلب نقاط القياس للجهاز' })
  @ApiParam({ name: 'id', description: 'معرف الجهاز' })
  @ApiResponse({ status: 200, description: 'نقاط القياس للجهاز' })
  getDataPoints(@Param('id', ParseUUIDPipe) id: string) {
    return this.devicesService.getDataPoints(id);
  }

  @Get(':id/latest-readings')
  @ApiOperation({ summary: 'جلب آخر قراءات الجهاز' })
  @ApiParam({ name: 'id', description: 'معرف الجهاز' })
  @ApiResponse({ status: 200, description: 'آخر قراءات الجهاز' })
  getLatestReadings(@Param('id', ParseUUIDPipe) id: string) {
    return this.devicesService.getLatestReadings(id);
  }
}
