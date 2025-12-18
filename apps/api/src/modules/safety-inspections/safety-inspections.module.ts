import { Module } from '@nestjs/common';
import { SafetyInspectionsService } from './safety-inspections.service';
import { SafetyInspectionsController } from './safety-inspections.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SafetyInspectionsController],
  providers: [SafetyInspectionsService],
  exports: [SafetyInspectionsService],
})
export class SafetyInspectionsModule {}
