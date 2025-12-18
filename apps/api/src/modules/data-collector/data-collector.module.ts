import { Module } from '@nestjs/common';
import { DataCollectorController } from './data-collector.controller';
import { DataCollectorService } from './data-collector.service';
import { ModbusClientService } from './modbus-client.service';
import { ModbusSimulatorService } from './modbus-simulator.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ConnectionsModule } from '../connections/connections.module';
import { EventLogsModule } from '../event-logs/event-logs.module';

@Module({
  imports: [PrismaModule, ConnectionsModule, EventLogsModule],
  controllers: [DataCollectorController],
  providers: [
    DataCollectorService,
    ModbusClientService,
    ModbusSimulatorService,
  ],
  exports: [DataCollectorService, ModbusClientService, ModbusSimulatorService],
})
export class DataCollectorModule {}
