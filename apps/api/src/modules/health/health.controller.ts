import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('الصحة - Health')
@Controller('v1/health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'فحص صحة النظام' })
  async check() {
    try {
      await this.prisma.$executeRawUnsafe('SELECT 1');
      return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
    } catch (e: any) {
      return { status: 'error', database: 'disconnected', error: e.message };
    }
  }
}
