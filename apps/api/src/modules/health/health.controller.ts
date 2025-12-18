import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('الصحة')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'فحص صحة النظام' })
  @ApiResponse({ status: 200, description: 'النظام يعمل بشكل طبيعي' })
  async check() {
    const dbStatus = await this.checkDatabase();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'فحص جاهزية النظام' })
  @ApiResponse({ status: 200, description: 'النظام جاهز' })
  async ready() {
    const dbStatus = await this.checkDatabase();
    
    if (!dbStatus.connected) {
      throw new Error('قاعدة البيانات غير متصلة');
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'فحص حياة النظام' })
  @ApiResponse({ status: 200, description: 'النظام حي' })
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { connected: true, latency: 'ok' };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}
