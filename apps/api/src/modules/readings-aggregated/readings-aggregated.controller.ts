import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReadingsAggregatedService } from './readings-aggregated.service';
import {
  ReadingsAggregatedQueryDto,
  AggregateReadingsDto,
  ReadingHourlyResponseDto,
  ReadingDailyResponseDto,
  AggregationResultDto,
} from './dto';

@ApiTags('القراءات المجمعة - Aggregated Readings')
@Controller('readings')
export class ReadingsAggregatedController {
  constructor(private readonly readingsAggregatedService: ReadingsAggregatedService) {}

  @Get('hourly')
  @ApiOperation({ summary: 'جلب القراءات المجمعة بالساعة' })
  @ApiResponse({ status: 200, description: 'قائمة القراءات المجمعة بالساعة', type: [ReadingHourlyResponseDto] })
  findHourly(@Query() query: ReadingsAggregatedQueryDto) {
    return this.readingsAggregatedService.findHourly(query);
  }

  @Get('daily')
  @ApiOperation({ summary: 'جلب القراءات المجمعة باليوم' })
  @ApiResponse({ status: 200, description: 'قائمة القراءات المجمعة باليوم', type: [ReadingDailyResponseDto] })
  findDaily(@Query() query: ReadingsAggregatedQueryDto) {
    return this.readingsAggregatedService.findDaily(query);
  }

  @Post('aggregate')
  @ApiOperation({ summary: 'تجميع القراءات يدوياً' })
  @ApiResponse({ status: 200, description: 'نتيجة التجميع', type: AggregationResultDto })
  aggregateReadings(@Body() dto: AggregateReadingsDto) {
    return this.readingsAggregatedService.aggregateReadings(dto);
  }

  @Get('aggregated/statistics')
  @ApiOperation({ summary: 'إحصائيات القراءات المجمعة' })
  @ApiResponse({ status: 200, description: 'إحصائيات التجميع' })
  getStatistics(@Query('deviceId') deviceId?: string) {
    return this.readingsAggregatedService.getStatistics(deviceId);
  }

  @Get('aggregated/statistics/:deviceId')
  @ApiOperation({ summary: 'إحصائيات القراءات المجمعة لجهاز معين' })
  @ApiParam({ name: 'deviceId', description: 'معرف الجهاز' })
  @ApiResponse({ status: 200, description: 'إحصائيات التجميع للجهاز' })
  getDeviceStatistics(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
    return this.readingsAggregatedService.getStatistics(deviceId);
  }
}
