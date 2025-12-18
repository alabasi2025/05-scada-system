import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommandsService } from './commands.service';
import { CreateCommandDto, CommandQueryDto } from './dto';

@ApiTags('أوامر التحكم - Commands')
@Controller('v1/scada/commands')
export class CommandsController {
  constructor(private readonly service: CommandsService) {}

  @Post() @ApiOperation({ summary: 'إنشاء أمر' }) create(@Body() dto: CreateCommandDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'جلب الأوامر' }) findAll(@Query() query: CommandQueryDto) { return this.service.findAll(query); }
  @Get(':id') @ApiOperation({ summary: 'جلب أمر' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Put(':id/approve') @ApiOperation({ summary: 'الموافقة على أمر' }) approve(@Param('id') id: string, @Body('userId') userId: string) { return this.service.approve(id, userId); }
  @Put(':id/execute') @ApiOperation({ summary: 'تنفيذ أمر' }) execute(@Param('id') id: string) { return this.service.execute(id); }
  @Put(':id/reject') @ApiOperation({ summary: 'رفض أمر' }) reject(@Param('id') id: string, @Body('userId') userId: string, @Body('reason') reason: string) { return this.service.reject(id, userId, reason); }
}
