import { Module } from '@nestjs/common';
import { AlarmRulesController } from './alarm-rules.controller';
import { AlarmRulesService } from './alarm-rules.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlarmRulesController],
  providers: [AlarmRulesService],
  exports: [AlarmRulesService],
})
export class AlarmRulesModule {}
