import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { DataCollectorService } from './data-collector.service';
import { ModbusSimulatorService } from './modbus-simulator.service';

@ApiTags('جمع البيانات - Data Collector')
@Controller('data-collector')
export class DataCollectorController {
  constructor(
    private readonly dataCollectorService: DataCollectorService,
    private readonly simulatorService: ModbusSimulatorService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'حالة خدمة جمع البيانات' })
  @ApiResponse({ status: 200, description: 'حالة الخدمة' })
  getStatus() {
    return this.dataCollectorService.getCollectionStatus();
  }

  @Post('start')
  @ApiOperation({ summary: 'بدء جمع البيانات' })
  @ApiResponse({ status: 200, description: 'تم بدء جمع البيانات' })
  async startCollection() {
    await this.dataCollectorService.startCollection();
    return { message: 'تم بدء جمع البيانات' };
  }

  @Post('stop')
  @ApiOperation({ summary: 'إيقاف جمع البيانات' })
  @ApiResponse({ status: 200, description: 'تم إيقاف جمع البيانات' })
  async stopCollection() {
    await this.dataCollectorService.stopCollection();
    return { message: 'تم إيقاف جمع البيانات' };
  }

  @Post('collect/:stationId')
  @ApiOperation({ summary: 'جمع بيانات محطة معينة يدوياً' })
  @ApiParam({ name: 'stationId', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'نتائج جمع البيانات' })
  async collectStationData(@Param('stationId', ParseUUIDPipe) stationId: string) {
    const results = await this.dataCollectorService.collectStationData(stationId);
    return {
      message: `تم جمع ${results.length} قراءة`,
      results,
    };
  }

  @Post('poll-interval')
  @ApiOperation({ summary: 'تغيير فترة الاستطلاع' })
  @ApiBody({ schema: { type: 'object', properties: { intervalMs: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'تم تغيير فترة الاستطلاع' })
  setPollInterval(@Body('intervalMs') intervalMs: number) {
    this.dataCollectorService.setPollInterval(intervalMs);
    return { message: `تم تغيير فترة الاستطلاع إلى ${intervalMs}ms` };
  }

  // Simulator endpoints
  @Get('simulator/status')
  @ApiOperation({ summary: 'حالة محاكي Modbus' })
  @ApiResponse({ status: 200, description: 'حالة المحاكي' })
  getSimulatorStatus() {
    return this.simulatorService.getStatus();
  }

  @Post('simulator/register')
  @ApiOperation({ summary: 'تعيين قيمة سجل في المحاكي' })
  @ApiBody({ schema: { type: 'object', properties: { address: { type: 'number' }, value: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'تم تعيين القيمة' })
  setSimulatorRegister(
    @Body('address') address: number,
    @Body('value') value: number,
  ) {
    this.simulatorService.setRegister(address, value);
    return { message: `تم تعيين السجل ${address} = ${value}` };
  }

  @Get('simulator/register/:address')
  @ApiOperation({ summary: 'قراءة قيمة سجل من المحاكي' })
  @ApiParam({ name: 'address', description: 'عنوان السجل' })
  @ApiResponse({ status: 200, description: 'قيمة السجل' })
  getSimulatorRegister(@Param('address') address: string) {
    const value = this.simulatorService.getRegister(parseInt(address, 10));
    return { address: parseInt(address, 10), value };
  }

  @Post('simulator/alarm/:index/trigger')
  @ApiOperation({ summary: 'تفعيل إنذار في المحاكي' })
  @ApiParam({ name: 'index', description: 'رقم الإنذار' })
  @ApiResponse({ status: 200, description: 'تم تفعيل الإنذار' })
  triggerSimulatorAlarm(@Param('index') index: string) {
    this.simulatorService.triggerAlarm(parseInt(index, 10));
    return { message: `تم تفعيل الإنذار ${index}` };
  }

  @Post('simulator/alarm/:index/clear')
  @ApiOperation({ summary: 'مسح إنذار في المحاكي' })
  @ApiParam({ name: 'index', description: 'رقم الإنذار' })
  @ApiResponse({ status: 200, description: 'تم مسح الإنذار' })
  clearSimulatorAlarm(@Param('index') index: string) {
    this.simulatorService.clearAlarm(parseInt(index, 10));
    return { message: `تم مسح الإنذار ${index}` };
  }
}
