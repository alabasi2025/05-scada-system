import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Common Modules
import { PrismaModule } from '../common/prisma/prisma.module';

// Feature Modules
import { StationsModule } from '../modules/stations/stations.module';
import { DevicesModule } from '../modules/devices/devices.module';
import { DataPointsModule } from '../modules/data-points/data-points.module';
import { ReadingsModule } from '../modules/readings/readings.module';
import { ReadingsAggregatedModule } from '../modules/readings-aggregated/readings-aggregated.module';
import { AlarmsModule } from '../modules/alarms/alarms.module';
import { AlarmRulesModule } from '../modules/alarm-rules/alarm-rules.module';
import { AlarmEngineModule } from '../modules/alarm-engine/alarm-engine.module';
import { CommandsModule } from '../modules/commands/commands.module';
import { ConnectionsModule } from '../modules/connections/connections.module';
import { EventLogsModule } from '../modules/event-logs/event-logs.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { DataCollectorModule } from '../modules/data-collector/data-collector.module';
import { CommandExecutorModule } from '../modules/command-executor/command-executor.module';
import { ReportsModule } from '../modules/reports/reports.module';
import { HealthModule } from '../modules/health/health.module';
import { WebsocketModule } from '../modules/websocket/websocket.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduler for cron jobs
    ScheduleModule.forRoot(),

    // Event Emitter for real-time events
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Database
    PrismaModule,

    // Feature Modules
    StationsModule,
    DevicesModule,
    DataPointsModule,
    ReadingsModule,
    ReadingsAggregatedModule,
    AlarmsModule,
    AlarmRulesModule,
    AlarmEngineModule,
    CommandsModule,
    ConnectionsModule,
    EventLogsModule,
    SettingsModule,
    DataCollectorModule,
    CommandExecutorModule,
    ReportsModule,
    HealthModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
