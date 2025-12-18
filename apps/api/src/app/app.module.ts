import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Common Modules
import { PrismaModule } from '../common/prisma/prisma.module';

// Feature Modules - SCADA Core
import { StationsModule } from '../modules/stations/stations.module';
import { DevicesModule } from '../modules/devices/devices.module';
import { MonitoringPointsModule } from '../modules/monitoring-points/monitoring_points.module';
import { ReadingsModule } from '../modules/readings/readings.module';
import { AlertsModule } from '../modules/alerts/alerts.module';
import { CommandsModule } from '../modules/commands/commands.module';
import { EnergyModule } from '../modules/energy/energy.module';
import { HealthModule } from '../modules/health/health.module';

// Feature Modules - Safety & Incidents
import { IncidentsModule } from '../modules/incidents/incidents.module';
import { SafetyInspectionsModule } from '../modules/safety-inspections/safety-inspections.module';

// Feature Modules - Quality & Safety
import { QualityModule } from '../modules/quality/quality.module';
import { SecurityModule } from '../modules/security/security.module';

// Feature Modules - Digital Twin
import { DigitalTwinModule } from '../modules/digital-twin/digital-twin.module';

// Feature Modules - Integrations
import { AcrelModule } from '../modules/acrel/acrel.module';

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

    // Feature Modules - SCADA Core
    StationsModule,
    DevicesModule,
    MonitoringPointsModule,
    ReadingsModule,
    AlertsModule,
    CommandsModule,
    EnergyModule,
    HealthModule,

    // Feature Modules - Safety & Incidents
    IncidentsModule,
    SafetyInspectionsModule,

    // Feature Modules - Quality & Safety
    QualityModule,
    SecurityModule,

    // Feature Modules - Digital Twin
    DigitalTwinModule,

    // Feature Modules - Integrations
    AcrelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
