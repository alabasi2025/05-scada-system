import { Module } from '@nestjs/common';
import { ScadaGateway } from './scada.gateway';

@Module({
  providers: [ScadaGateway],
  exports: [ScadaGateway],
})
export class WebsocketModule {}
