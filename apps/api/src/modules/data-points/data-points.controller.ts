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
import { DataPointsService } from './data-points.service';
import { CreateDataPointDto, UpdateDataPointDto, DataPointQueryDto } from './dto';

@ApiTags('نقاط القياس')
@Controller('data-points')
export class DataPointsController {
  constructor(private readonly dataPointsService: DataPointsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء نقطة قياس جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء نقطة القياس بنجاح' })
  @ApiResponse({ status: 409, description: 'نقطة القياس موجودة مسبقاً' })
  create(@Body() createDataPointDto: CreateDataPointDto) {
    return this.dataPointsService.create(createDataPointDto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع نقاط القياس' })
  @ApiResponse({ status: 200, description: 'قائمة نقاط القياس' })
  findAll(@Query() query: DataPointQueryDto) {
    return this.dataPointsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب نقطة قياس محددة' })
  @ApiParam({ name: 'id', description: 'معرف نقطة القياس' })
  @ApiResponse({ status: 200, description: 'بيانات نقطة القياس' })
  @ApiResponse({ status: 404, description: 'نقطة القياس غير موجودة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataPointsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث نقطة قياس' })
  @ApiParam({ name: 'id', description: 'معرف نقطة القياس' })
  @ApiResponse({ status: 200, description: 'تم تحديث نقطة القياس بنجاح' })
  @ApiResponse({ status: 404, description: 'نقطة القياس غير موجودة' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDataPointDto: UpdateDataPointDto,
  ) {
    return this.dataPointsService.update(id, updateDataPointDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف نقطة قياس' })
  @ApiParam({ name: 'id', description: 'معرف نقطة القياس' })
  @ApiResponse({ status: 204, description: 'تم حذف نقطة القياس بنجاح' })
  @ApiResponse({ status: 404, description: 'نقطة القياس غير موجودة' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataPointsService.remove(id);
  }

  @Get(':id/readings')
  @ApiOperation({ summary: 'جلب قراءات نقطة القياس' })
  @ApiParam({ name: 'id', description: 'معرف نقطة القياس' })
  @ApiQuery({ name: 'startDate', required: false, description: 'تاريخ البداية' })
  @ApiQuery({ name: 'endDate', required: false, description: 'تاريخ النهاية' })
  @ApiQuery({ name: 'limit', required: false, description: 'عدد القراءات' })
  @ApiResponse({ status: 200, description: 'قراءات نقطة القياس' })
  getReadings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dataPointsService.getReadings(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Get(':id/latest')
  @ApiOperation({ summary: 'جلب آخر قراءة لنقطة القياس' })
  @ApiParam({ name: 'id', description: 'معرف نقطة القياس' })
  @ApiResponse({ status: 200, description: 'آخر قراءة' })
  getLatestReading(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataPointsService.getLatestReading(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'جلب إحصائيات نقطة القياس' })
  @ApiParam({ name: 'id', description: 'معرف نقطة القياس' })
  @ApiQuery({ name: 'startDate', required: true, description: 'تاريخ البداية' })
  @ApiQuery({ name: 'endDate', required: true, description: 'تاريخ النهاية' })
  @ApiResponse({ status: 200, description: 'إحصائيات نقطة القياس' })
  getStatistics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dataPointsService.getStatistics(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
