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
} from '@nestjs/swagger';
import { CommandsService } from './commands.service';
import { CreateCommandDto, ApproveCommandDto, RejectCommandDto, CommandQueryDto } from './dto';

@ApiTags('أوامر التحكم')
@Controller('commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء أمر تحكم جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الأمر بنجاح' })
  create(@Body() createCommandDto: CreateCommandDto) {
    // في الإنتاج، يجب الحصول على requestedBy من JWT
    const requestedBy = '00000000-0000-0000-0000-000000000000';
    return this.commandsService.create(createCommandDto, requestedBy);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع الأوامر' })
  @ApiResponse({ status: 200, description: 'قائمة الأوامر' })
  findAll(@Query() query: CommandQueryDto) {
    return this.commandsService.findAll(query);
  }

  @Get('pending')
  @ApiOperation({ summary: 'جلب الأوامر المعلقة' })
  @ApiResponse({ status: 200, description: 'الأوامر المعلقة' })
  getPendingCommands() {
    return this.commandsService.getPendingCommands();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'جلب إحصائيات الأوامر' })
  @ApiResponse({ status: 200, description: 'إحصائيات الأوامر' })
  getStatistics() {
    return this.commandsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب أمر محدد' })
  @ApiParam({ name: 'id', description: 'معرف الأمر' })
  @ApiResponse({ status: 200, description: 'بيانات الأمر' })
  @ApiResponse({ status: 404, description: 'الأمر غير موجود' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commandsService.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'الموافقة على أمر' })
  @ApiParam({ name: 'id', description: 'معرف الأمر' })
  @ApiResponse({ status: 200, description: 'تمت الموافقة على الأمر' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveCommandDto,
  ) {
    // في الإنتاج، يجب الحصول على approvedBy من JWT
    const approvedBy = '00000000-0000-0000-0000-000000000000';
    return this.commandsService.approve(id, approvedBy, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'رفض أمر' })
  @ApiParam({ name: 'id', description: 'معرف الأمر' })
  @ApiResponse({ status: 200, description: 'تم رفض الأمر' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectCommandDto,
  ) {
    return this.commandsService.reject(id, dto);
  }
}
