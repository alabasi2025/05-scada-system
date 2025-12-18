import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Common Modules
import { PrismaModule } from '../common/prisma/prisma.module';

// Feature Modules
import { StationsModule } from '../modules/stations/stations.module';
import { DevicesModule } from '../modules/devices/devices.module';
import { DataPointsModule } from '../modules/data-points/data-points.module';
import { ReadingsModule } from '../modules/readings/readings.module';
import { AlarmsModule } from '../modules/alarms/alarms.module';
import { CommandsModule } from '../modules/commands/commands.module';
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
    AlarmsModule,
    CommandsModule,
    HealthModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
