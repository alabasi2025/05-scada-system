import { Module } from '@nestjs/common';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [ReadingsController], providers: [ReadingsService], exports: [ReadingsService] })
export class ReadingsModule {}
