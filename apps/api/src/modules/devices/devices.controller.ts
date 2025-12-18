import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceQueryDto } from './dto';

@ApiTags('الأجهزة - Devices')
@Controller('v1/scada/devices')
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  @Post() @ApiOperation({ summary: 'إنشاء جهاز' }) create(@Body() dto: CreateDeviceDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'جلب الأجهزة' }) findAll(@Query() query: DeviceQueryDto) { return this.service.findAll(query); }
  @Get(':id') @ApiOperation({ summary: 'جلب جهاز' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Put(':id') @ApiOperation({ summary: 'تحديث جهاز' }) update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) { return this.service.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'حذف جهاز' }) remove(@Param('id') id: string) { return this.service.remove(id); }
}
