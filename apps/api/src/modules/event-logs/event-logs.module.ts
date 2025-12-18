import { Module, Global } from '@nestjs/common';
import { EventLogsController } from './event-logs.controller';
import { EventLogsService } from './event-logs.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [EventLogsController],
  providers: [EventLogsService],
  exports: [EventLogsService],
})
export class EventLogsModule {}
