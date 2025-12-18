import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [AlertsController], providers: [AlertsService], exports: [AlertsService] })
export class AlertsModule {}
