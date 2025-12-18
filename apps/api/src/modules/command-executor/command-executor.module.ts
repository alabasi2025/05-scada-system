import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DataCollectorModule } from '../data-collector/data-collector.module';
import { CommandExecutorService } from './command-executor.service';
import { CommandExecutorController } from './command-executor.controller';

@Module({
  imports: [PrismaModule, DataCollectorModule],
  controllers: [CommandExecutorController],
  providers: [CommandExecutorService],
  exports: [CommandExecutorService],
})
export class CommandExecutorModule {}
