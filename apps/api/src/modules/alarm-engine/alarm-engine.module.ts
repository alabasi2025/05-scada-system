import { Module } from '@nestjs/common';
import { AlarmEngineController } from './alarm-engine.controller';
import { AlarmEngineService } from './alarm-engine.service';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AlarmRulesModule } from '../alarm-rules/alarm-rules.module';
import { EventLogsModule } from '../event-logs/event-logs.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, AlarmRulesModule, EventLogsModule, SettingsModule],
  controllers: [AlarmEngineController],
  providers: [AlarmEngineService, NotificationService],
  exports: [AlarmEngineService, NotificationService],
})
export class AlarmEngineModule {}
