import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';

@ApiTags('الحوادث')
@Controller('v1/incidents')
export class IncidentsController {
  constructor(private service: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة الحوادث' })
  findAll(@Query('stationId') stationId?: string, @Query('status') status?: string, @Query('severity') severity?: string) {
    return this.service.findAll({ stationId, status, severity });
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل حادث' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'تسجيل حادث جديد' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث حادث' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'حل الحادث' })
  resolve(@Param('id') id: string, @Body() data: any) {
    return this.service.resolve(id, data);
  }
}
