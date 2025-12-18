import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReadingsService } from './readings.service';
import { CreateReadingDto, ReadingQueryDto } from './dto';

@ApiTags('القراءات - Readings')
@Controller('v1/scada/readings')
export class ReadingsController {
  constructor(private readonly service: ReadingsService) {}

  @Post('live') @ApiOperation({ summary: 'إضافة قراءة حية' }) createLive(@Body() dto: CreateReadingDto) { return this.service.createLive(dto); }
  @Get('live') @ApiOperation({ summary: 'جلب القراءات الحية' }) getLive(@Query() query: ReadingQueryDto) { return this.service.getLive(query); }
  @Get('history') @ApiOperation({ summary: 'جلب سجل القراءات' }) getHistory(@Query() query: ReadingQueryDto) { return this.service.getHistory(query); }
  @Get('station/:stationId') @ApiOperation({ summary: 'آخر قراءات المحطة' }) getLatestByStation(@Param('stationId') stationId: string) { return this.service.getLatestByStation(stationId); }
}
