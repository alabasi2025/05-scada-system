import { Module } from '@nestjs/common';
import { AcrelService } from './acrel.service';
import { AcrelController } from './acrel.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcrelController],
  providers: [AcrelService],
  exports: [AcrelService],
})
export class AcrelModule {}
