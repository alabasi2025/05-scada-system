import { Injectable, inject, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WsMessage, Reading, Alarm } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly connected = signal(false);
  private readonly reconnecting = signal(false);

  readonly isConnected = computed(() => this.connected());
  readonly isReconnecting = computed(() => this.reconnecting());

  // Subjects for different event types
  private readingSubject = new Subject<WsMessage<Reading>>();
  private alarmSubject = new Subject<WsMessage<Alarm>>();
  private commandSubject = new Subject<WsMessage<any>>();
  private stationSubject = new Subject<WsMessage<any>>();

  // Observables
  readonly readings$ = this.readingSubject.asObservable();
  readonly alarms$ = this.alarmSubject.asObservable();
  readonly commands$ = this.commandSubject.asObservable();
  readonly station$ = this.stationSubject.asObservable();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected.set(true);
      this.reconnecting.set(false);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected.set(false);
    });

    this.socket.on('reconnecting', () => {
      console.log('WebSocket reconnecting...');
      this.reconnecting.set(true);
    });

    this.socket.on('connected', (data: any) => {
      console.log('Server welcome:', data);
    });

    // Listen for readings
    this.socket.on('reading', (message: WsMessage<Reading>) => {
      this.readingSubject.next(message);
    });

    // Listen for alarms
    this.socket.on('alarm', (message: WsMessage<Alarm>) => {
      this.alarmSubject.next(message);
    });

    // Listen for commands
    this.socket.on('command', (message: WsMessage<any>) => {
      this.commandSubject.next(message);
    });

    // Listen for station events
    this.socket.on('station:reading', (message: WsMessage<any>) => {
      this.stationSubject.next({ ...message, type: 'reading' });
    });

    this.socket.on('station:alarm', (message: WsMessage<any>) => {
      this.stationSubject.next({ ...message, type: 'alarm' });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected.set(false);
    }
  }

  // Subscribe to device readings
  subscribeToReadings(deviceId?: string, stationId?: string): void {
    this.socket?.emit('subscribe:readings', { deviceId, stationId });
  }

  unsubscribeFromReadings(deviceId?: string, stationId?: string): void {
    this.socket?.emit('unsubscribe:readings', { deviceId, stationId });
  }

  // Subscribe to alarms
  subscribeToAlarms(stationId?: string): void {
    this.socket?.emit('subscribe:alarms', { stationId });
  }

  unsubscribeFromAlarms(stationId?: string): void {
    this.socket?.emit('unsubscribe:alarms', { stationId });
  }

  // Subscribe to station
  subscribeToStation(stationId: string): void {
    this.socket?.emit('subscribe:station', { stationId });
  }

  unsubscribeFromStation(stationId: string): void {
    this.socket?.emit('unsubscribe:station', { stationId });
  }

  // Ping server
  ping(): Observable<{ pong: boolean; timestamp: string }> {
    return new Observable(observer => {
      this.socket?.emit('ping', {}, (response: any) => {
        observer.next(response);
        observer.complete();
      });
    });
  }
}
