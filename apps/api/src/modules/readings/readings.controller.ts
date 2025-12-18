import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReadingsService } from './readings.service';
import { CreateReadingDto, CreateBulkReadingsDto, ReadingQueryDto, HistoricalReadingQueryDto } from './dto';

@ApiTags('القراءات')
@Controller('readings')
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء قراءة جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء القراءة بنجاح' })
  create(@Body() createReadingDto: CreateReadingDto) {
    return this.readingsService.create(createReadingDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'إنشاء قراءات متعددة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء القراءات بنجاح' })
  createBulk(@Body() createBulkReadingsDto: CreateBulkReadingsDto) {
    return this.readingsService.createBulk(createBulkReadingsDto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع القراءات' })
  @ApiResponse({ status: 200, description: 'قائمة القراءات' })
  findAll(@Query() query: ReadingQueryDto) {
    return this.readingsService.findAll(query);
  }

  @Get('live/:deviceId')
  @ApiOperation({ summary: 'جلب القراءات الحية للجهاز' })
  @ApiParam({ name: 'deviceId', description: 'معرف الجهاز' })
  @ApiResponse({ status: 200, description: 'القراءات الحية' })
  getLiveReadings(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
    return this.readingsService.getLiveReadings(deviceId);
  }

  @Get('history')
  @ApiOperation({ summary: 'جلب القراءات التاريخية' })
  @ApiResponse({ status: 200, description: 'القراءات التاريخية' })
  getHistoricalReadings(@Query() query: HistoricalReadingQueryDto) {
    return this.readingsService.getHistoricalReadings(query);
  }

  @Get('hourly/:deviceId')
  @ApiOperation({ summary: 'جلب القراءات الساعية' })
  @ApiParam({ name: 'deviceId', description: 'معرف الجهاز' })
  @ApiQuery({ name: 'date', required: true, description: 'التاريخ' })
  @ApiResponse({ status: 200, description: 'القراءات الساعية' })
  getHourlyReadings(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Query('date') date: string,
  ) {
    return this.readingsService.getHourlyReadings(deviceId, new Date(date));
  }

  @Get('daily/:deviceId')
  @ApiOperation({ summary: 'جلب القراءات اليومية' })
  @ApiParam({ name: 'deviceId', description: 'معرف الجهاز' })
  @ApiQuery({ name: 'startDate', required: true, description: 'تاريخ البداية' })
  @ApiQuery({ name: 'endDate', required: true, description: 'تاريخ النهاية' })
  @ApiResponse({ status: 200, description: 'القراءات اليومية' })
  getDailyReadings(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.readingsService.getDailyReadings(
      deviceId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
