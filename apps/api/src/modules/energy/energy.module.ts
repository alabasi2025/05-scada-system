import { Module } from '@nestjs/common';
import { EnergyController } from './energy.controller';
import { EnergyService } from './energy.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [EnergyController], providers: [EnergyService], exports: [EnergyService] })
export class EnergyModule {}
