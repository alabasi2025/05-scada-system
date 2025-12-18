import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Common Modules
import { PrismaModule } from '../common/prisma/prisma.module';

// Guards
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';

// Auth Module
import { AuthModule } from '../modules/auth/auth.module';

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

    // Rate Limiting - حد أقصى 100 طلب كل 60 ثانية
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

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

    // Auth Module
    AuthModule,

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
  providers: [
    AppService,
    // Global Guards - Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Guards - RBAC
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
