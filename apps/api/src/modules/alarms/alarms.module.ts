import { Module } from '@nestjs/common';
import { AlarmsController, AlarmRulesController } from './alarms.controller';
import { AlarmsService } from './alarms.service';

@Module({
  controllers: [AlarmsController, AlarmRulesController],
  providers: [AlarmsService],
  exports: [AlarmsService],
})
export class AlarmsModule {}
