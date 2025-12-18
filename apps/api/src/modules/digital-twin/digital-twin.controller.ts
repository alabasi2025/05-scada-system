import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DigitalTwinService } from './digital-twin.service';

@ApiTags('التوأم الرقمي')
@Controller('v1/digital-twin')
export class DigitalTwinController {
  constructor(private service: DigitalTwinService) {}

  // Network Nodes
  @Get('nodes')
  @ApiOperation({ summary: 'قائمة عقد الشبكة' })
  findAllNodes(@Query('stationId') stationId?: string, @Query('nodeType') nodeType?: string, @Query('status') status?: string) {
    return this.service.findAllNodes({ stationId, nodeType, status });
  }

  @Get('nodes/:id')
  @ApiOperation({ summary: 'تفاصيل عقدة' })
  findNodeById(@Param('id') id: string) {
    return this.service.findNodeById(id);
  }

  @Post('nodes')
  @ApiOperation({ summary: 'إنشاء عقدة جديدة' })
  createNode(@Body() data: any) {
    return this.service.createNode(data);
  }

  @Put('nodes/:id')
  @ApiOperation({ summary: 'تحديث عقدة' })
  updateNode(@Param('id') id: string, @Body() data: any) {
    return this.service.updateNode(id, data);
  }

  @Delete('nodes/:id')
  @ApiOperation({ summary: 'حذف عقدة' })
  deleteNode(@Param('id') id: string) {
    return this.service.deleteNode(id);
  }

  // Network Segments
  @Get('segments')
  @ApiOperation({ summary: 'قائمة مقاطع الشبكة' })
  findAllSegments(@Query('stationId') stationId?: string, @Query('voltageLevel') voltageLevel?: string) {
    return this.service.findAllSegments({ stationId, voltageLevel });
  }

  @Post('segments')
  @ApiOperation({ summary: 'إنشاء مقطع جديد' })
  createSegment(@Body() data: any) {
    return this.service.createSegment(data);
  }

  @Put('segments/:id')
  @ApiOperation({ summary: 'تحديث مقطع' })
  updateSegment(@Param('id') id: string, @Body() data: any) {
    return this.service.updateSegment(id, data);
  }

  @Delete('segments/:id')
  @ApiOperation({ summary: 'حذف مقطع' })
  deleteSegment(@Param('id') id: string) {
    return this.service.deleteSegment(id);
  }

  // Node Components
  @Post('nodes/:nodeId/components')
  @ApiOperation({ summary: 'إضافة مكون للعقدة' })
  addComponent(@Param('nodeId') nodeId: string, @Body() data: any) {
    return this.service.addComponent(nodeId, data);
  }

  @Put('components/:id')
  @ApiOperation({ summary: 'تحديث مكون' })
  updateComponent(@Param('id') id: string, @Body() data: any) {
    return this.service.updateComponent(id, data);
  }

  @Delete('components/:id')
  @ApiOperation({ summary: 'حذف مكون' })
  deleteComponent(@Param('id') id: string) {
    return this.service.deleteComponent(id);
  }

  // Geo Locations
  @Get('locations')
  @ApiOperation({ summary: 'قائمة المواقع الجغرافية' })
  findAllLocations(@Query('entityType') entityType?: string) {
    return this.service.findAllLocations({ entityType });
  }

  @Post('locations')
  @ApiOperation({ summary: 'إضافة موقع جغرافي' })
  createLocation(@Body() data: any) {
    return this.service.createLocation(data);
  }

  @Put('locations/:id')
  @ApiOperation({ summary: 'تحديث موقع جغرافي' })
  updateLocation(@Param('id') id: string, @Body() data: any) {
    return this.service.updateLocation(id, data);
  }

  // Statistics
  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات الشبكة' })
  getNetworkStats() {
    return this.service.getNetworkStats();
  }
}
