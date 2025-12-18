import { Module } from '@nestjs/common';
import { ReadingsAggregatedController } from './readings-aggregated.controller';
import { ReadingsAggregatedService } from './readings-aggregated.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReadingsAggregatedController],
  providers: [ReadingsAggregatedService],
  exports: [ReadingsAggregatedService],
})
export class ReadingsAggregatedModule {}
