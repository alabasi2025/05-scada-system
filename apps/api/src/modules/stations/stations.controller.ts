import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StationsService } from './stations.service';
import { CreateStationDto, UpdateStationDto, StationQueryDto } from './dto';

@ApiTags('المحطات - Stations')
@Controller('v1/scada/stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء محطة جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء المحطة بنجاح' })
  @ApiResponse({ status: 409, description: 'المحطة موجودة مسبقاً' })
  create(@Body() dto: CreateStationDto) {
    return this.stationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع المحطات' })
  @ApiResponse({ status: 200, description: 'قائمة المحطات' })
  findAll(@Query() query: StationQueryDto) {
    return this.stationsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات المحطات' })
  @ApiResponse({ status: 200, description: 'إحصائيات المحطات' })
  getStats() {
    return this.stationsService.getStats();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'جلب محطة بالكود' })
  @ApiParam({ name: 'code', description: 'كود المحطة' })
  @ApiResponse({ status: 200, description: 'تفاصيل المحطة' })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  findByCode(@Param('code') code: string) {
    return this.stationsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب محطة بالمعرف' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'تفاصيل المحطة' })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث محطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'تم تحديث المحطة بنجاح' })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  update(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    return this.stationsService.update(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'تحديث حالة المحطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiQuery({ name: 'status', description: 'الحالة الجديدة', enum: ['online', 'offline', 'maintenance'] })
  @ApiResponse({ status: 200, description: 'تم تحديث الحالة بنجاح' })
  updateStatus(@Param('id') id: string, @Query('status') status: string) {
    return this.stationsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف محطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 204, description: 'تم حذف المحطة بنجاح' })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  remove(@Param('id') id: string) {
    return this.stationsService.remove(id);
  }
}
