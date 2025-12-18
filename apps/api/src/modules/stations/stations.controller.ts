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
import { StationsService } from './stations.service';
import { CreateStationDto, UpdateStationDto, StationQueryDto, StationResponseDto } from './dto';

@ApiTags('المحطات الكهربائية')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء محطة جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء المحطة بنجاح', type: StationResponseDto })
  @ApiResponse({ status: 409, description: 'المحطة موجودة مسبقاً' })
  create(@Body() createStationDto: CreateStationDto) {
    return this.stationsService.create(createStationDto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع المحطات' })
  @ApiResponse({ status: 200, description: 'قائمة المحطات' })
  findAll(@Query() query: StationQueryDto) {
    return this.stationsService.findAll(query);
  }

  @Get('map')
  @ApiOperation({ summary: 'جلب بيانات المحطات للخريطة' })
  @ApiResponse({ status: 200, description: 'بيانات المحطات للخريطة' })
  getMapData() {
    return this.stationsService.getMapData();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'جلب إحصائيات المحطات' })
  @ApiResponse({ status: 200, description: 'إحصائيات المحطات' })
  getStatistics() {
    return this.stationsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب محطة محددة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'بيانات المحطة', type: StationResponseDto })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث محطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'تم تحديث المحطة بنجاح', type: StationResponseDto })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStationDto: UpdateStationDto,
  ) {
    return this.stationsService.update(id, updateStationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف محطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 204, description: 'تم حذف المحطة بنجاح' })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.stationsService.remove(id);
  }

  @Get(':id/devices')
  @ApiOperation({ summary: 'جلب أجهزة المحطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'قائمة أجهزة المحطة' })
  getDevices(@Param('id', ParseUUIDPipe) id: string) {
    return this.stationsService.getDevices(id);
  }

  @Get(':id/readings')
  @ApiOperation({ summary: 'جلب قراءات المحطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiQuery({ name: 'startDate', required: false, description: 'تاريخ البداية' })
  @ApiQuery({ name: 'endDate', required: false, description: 'تاريخ النهاية' })
  @ApiResponse({ status: 200, description: 'قراءات المحطة' })
  getReadings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.stationsService.getReadings(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id/alarms')
  @ApiOperation({ summary: 'جلب تنبيهات المحطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiQuery({ name: 'status', required: false, description: 'حالة التنبيه' })
  @ApiResponse({ status: 200, description: 'تنبيهات المحطة' })
  getAlarms(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: string,
  ) {
    return this.stationsService.getAlarms(id, status);
  }
}
