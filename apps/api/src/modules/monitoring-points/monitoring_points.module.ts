import { Module } from '@nestjs/common';
import { MonitoringPointsController } from './monitoring_points.controller';
import { MonitoringPointsService } from './monitoring_points.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [MonitoringPointsController], providers: [MonitoringPointsService], exports: [MonitoringPointsService] })
export class MonitoringPointsModule {}
