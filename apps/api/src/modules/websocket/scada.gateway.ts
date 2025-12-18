import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/ws',
})
export class ScadaGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ScadaGateway');
  private connectedClients = new Map<string, { socket: Socket; subscriptions: Set<string> }>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, {
      socket: client,
      subscriptions: new Set(),
    });

    // إرسال رسالة ترحيب
    client.emit('connected', {
      message: 'مرحباً بك في نظام SCADA',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // ==================== الاشتراك في القراءات ====================

  @SubscribeMessage('subscribe:readings')
  handleSubscribeReadings(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId?: string; stationId?: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      if (data.deviceId) {
        const room = `readings:device:${data.deviceId}`;
        client.join(room);
        clientData.subscriptions.add(room);
        this.logger.log(`Client ${client.id} subscribed to ${room}`);
      }
      if (data.stationId) {
        const room = `readings:station:${data.stationId}`;
        client.join(room);
        clientData.subscriptions.add(room);
        this.logger.log(`Client ${client.id} subscribed to ${room}`);
      }
    }

    return { success: true, message: 'تم الاشتراك في القراءات' };
  }

  @SubscribeMessage('unsubscribe:readings')
  handleUnsubscribeReadings(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId?: string; stationId?: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      if (data.deviceId) {
        const room = `readings:device:${data.deviceId}`;
        client.leave(room);
        clientData.subscriptions.delete(room);
      }
      if (data.stationId) {
        const room = `readings:station:${data.stationId}`;
        client.leave(room);
        clientData.subscriptions.delete(room);
      }
    }

    return { success: true, message: 'تم إلغاء الاشتراك' };
  }

  // ==================== الاشتراك في التنبيهات ====================

  @SubscribeMessage('subscribe:alarms')
  handleSubscribeAlarms(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { stationId?: string; severity?: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      if (data.stationId) {
        const room = `alarms:station:${data.stationId}`;
        client.join(room);
        clientData.subscriptions.add(room);
      } else {
        client.join('alarms:all');
        clientData.subscriptions.add('alarms:all');
      }
    }

    return { success: true, message: 'تم الاشتراك في التنبيهات' };
  }

  @SubscribeMessage('unsubscribe:alarms')
  handleUnsubscribeAlarms(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { stationId?: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      if (data.stationId) {
        const room = `alarms:station:${data.stationId}`;
        client.leave(room);
        clientData.subscriptions.delete(room);
      } else {
        client.leave('alarms:all');
        clientData.subscriptions.delete('alarms:all');
      }
    }

    return { success: true, message: 'تم إلغاء الاشتراك' };
  }

  // ==================== الاشتراك في محطة محددة ====================

  @SubscribeMessage('subscribe:station')
  handleSubscribeStation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { stationId: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData && data.stationId) {
      const room = `station:${data.stationId}`;
      client.join(room);
      clientData.subscriptions.add(room);
      this.logger.log(`Client ${client.id} subscribed to station ${data.stationId}`);
    }

    return { success: true, message: 'تم الاشتراك في المحطة' };
  }

  @SubscribeMessage('unsubscribe:station')
  handleUnsubscribeStation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { stationId: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData && data.stationId) {
      const room = `station:${data.stationId}`;
      client.leave(room);
      clientData.subscriptions.delete(room);
    }

    return { success: true, message: 'تم إلغاء الاشتراك' };
  }

  // ==================== معالجة الأحداث ====================

  @OnEvent('reading.created')
  handleReadingCreated(reading: any) {
    // بث القراءة للمشتركين في الجهاز
    this.server.to(`readings:device:${reading.deviceId}`).emit('reading', {
      type: 'new',
      data: reading,
      timestamp: new Date().toISOString(),
    });

    // بث القراءة للمشتركين في المحطة
    if (reading.device?.stationId) {
      this.server.to(`readings:station:${reading.device.stationId}`).emit('reading', {
        type: 'new',
        data: reading,
        timestamp: new Date().toISOString(),
      });

      this.server.to(`station:${reading.device.stationId}`).emit('station:reading', {
        type: 'new',
        data: reading,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @OnEvent('alarm.created')
  handleAlarmCreated(alarm: any) {
    // بث التنبيه للجميع
    this.server.to('alarms:all').emit('alarm', {
      type: 'new',
      data: alarm,
      timestamp: new Date().toISOString(),
    });

    // بث التنبيه للمشتركين في المحطة
    this.server.to(`alarms:station:${alarm.stationId}`).emit('alarm', {
      type: 'new',
      data: alarm,
      timestamp: new Date().toISOString(),
    });

    this.server.to(`station:${alarm.stationId}`).emit('station:alarm', {
      type: 'new',
      data: alarm,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('alarm.acknowledged')
  handleAlarmAcknowledged(alarm: any) {
    this.server.to('alarms:all').emit('alarm', {
      type: 'acknowledged',
      data: alarm,
      timestamp: new Date().toISOString(),
    });

    this.server.to(`alarms:station:${alarm.stationId}`).emit('alarm', {
      type: 'acknowledged',
      data: alarm,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('alarm.cleared')
  handleAlarmCleared(alarm: any) {
    this.server.to('alarms:all').emit('alarm', {
      type: 'cleared',
      data: alarm,
      timestamp: new Date().toISOString(),
    });

    this.server.to(`alarms:station:${alarm.stationId}`).emit('alarm', {
      type: 'cleared',
      data: alarm,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('command.created')
  handleCommandCreated(command: any) {
    this.server.emit('command', {
      type: 'created',
      data: command,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('command.executed')
  handleCommandExecuted(command: any) {
    this.server.emit('command', {
      type: 'executed',
      data: command,
      timestamp: new Date().toISOString(),
    });
  }

  // ==================== إحصائيات الاتصال ====================

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { pong: true, timestamp: new Date().toISOString() };
  }

  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      clients: Array.from(this.connectedClients.entries()).map(([id, data]) => ({
        id,
        subscriptions: Array.from(data.subscriptions),
      })),
    };
  }

  // بث رسالة لجميع العملاء
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // بث رسالة لغرفة محددة
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
