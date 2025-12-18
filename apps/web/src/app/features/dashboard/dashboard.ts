import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StationsService, DevicesService, AlarmsService, WebSocketService } from '../../core/services';
import { Statistics, Alarm, Station } from '../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
        <span class="text-sm text-gray-500">آخر تحديث: {{ lastUpdate() }}</span>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Stations Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">المحطات</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stationStats()?.total || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1 text-green-600">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              متصل: {{ stationStats()?.byStatus?.['online'] || 0 }}
            </span>
            <span class="flex items-center gap-1 text-red-600">
              <span class="w-2 h-2 bg-red-500 rounded-full"></span>
              غير متصل: {{ stationStats()?.byStatus?.['offline'] || 0 }}
            </span>
          </div>
        </div>

        <!-- Devices Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">الأجهزة</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ deviceStats()?.total || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1 text-green-600">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              نشط: {{ deviceStats()?.byStatus?.['active'] || 0 }}
            </span>
            <span class="flex items-center gap-1 text-yellow-600">
              <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
              صيانة: {{ deviceStats()?.byStatus?.['maintenance'] || 0 }}
            </span>
          </div>
        </div>

        <!-- Active Alarms Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">التنبيهات النشطة</p>
              <p class="text-3xl font-bold" [class.text-red-600]="(alarmStats()?.active || 0) > 0" [class.text-gray-900]="(alarmStats()?.active || 0) === 0">
                {{ alarmStats()?.active || 0 }}
              </p>
            </div>
            <div class="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1 text-red-600">
              حرج: {{ alarmStats()?.bySeverity?.['critical'] || 0 }}
            </span>
            <span class="flex items-center gap-1 text-yellow-600">
              تحذير: {{ alarmStats()?.bySeverity?.['warning'] || 0 }}
            </span>
          </div>
        </div>

        <!-- System Health Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">حالة النظام</p>
              <p class="text-3xl font-bold text-green-600">{{ wsService.isConnected() ? 'متصل' : 'غير متصل' }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg flex items-center justify-center"
                 [class.bg-green-100]="wsService.isConnected()"
                 [class.bg-red-100]="!wsService.isConnected()">
              <svg class="w-6 h-6" [class.text-green-600]="wsService.isConnected()" [class.text-red-600]="!wsService.isConnected()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Alarms & Stations -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Alarms -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div class="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">آخر التنبيهات</h2>
            <a routerLink="/alarms" class="text-sm text-primary-600 hover:underline">عرض الكل</a>
          </div>
          <div class="p-4">
            @if (recentAlarms().length === 0) {
              <p class="text-center text-gray-500 py-8">لا توجد تنبيهات نشطة</p>
            } @else {
              <div class="space-y-3">
                @for (alarm of recentAlarms(); track alarm.id) {
                  <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span class="w-3 h-3 mt-1 rounded-full flex-shrink-0"
                          [class.bg-red-500]="alarm.severity === 'critical'"
                          [class.bg-orange-500]="alarm.severity === 'major'"
                          [class.bg-yellow-500]="alarm.severity === 'warning'"
                          [class.bg-blue-500]="alarm.severity === 'minor'"></span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ alarm.message }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ alarm.station?.name }} - {{ alarm.triggeredAt | date:'short' }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Stations Overview -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div class="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">المحطات</h2>
            <a routerLink="/stations" class="text-sm text-primary-600 hover:underline">عرض الكل</a>
          </div>
          <div class="p-4">
            @if (stations().length === 0) {
              <p class="text-center text-gray-500 py-8">لا توجد محطات</p>
            } @else {
              <div class="space-y-3">
                @for (station of stations().slice(0, 5); track station.id) {
                  <a [routerLink]="['/stations', station.id]" 
                     class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div class="flex items-center gap-3">
                      <span class="w-3 h-3 rounded-full"
                            [class.bg-green-500]="station.status === 'online'"
                            [class.bg-red-500]="station.status === 'offline'"
                            [class.bg-yellow-500]="station.status === 'maintenance'"></span>
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ station.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ station.code }} - {{ station.voltage }}</p>
                      </div>
                    </div>
                    <div class="text-left">
                      <p class="text-sm text-gray-600 dark:text-gray-300">{{ station._count?.devices || 0 }} جهاز</p>
                      @if ((station._count?.alarms || 0) > 0) {
                        <p class="text-xs text-red-600">{{ station._count?.alarms }} تنبيه</p>
                      }
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private stationsService = inject(StationsService);
  private devicesService = inject(DevicesService);
  private alarmsService = inject(AlarmsService);
  wsService = inject(WebSocketService);

  stationStats = signal<Statistics | null>(null);
  deviceStats = signal<Statistics | null>(null);
  alarmStats = signal<(Statistics & { active?: number; recentAlarms?: Alarm[] }) | null>(null);
  stations = signal<Station[]>([]);
  recentAlarms = signal<Alarm[]>([]);
  lastUpdate = signal('');

  private subscription = new Subscription();

  ngOnInit(): void {
    this.loadData();
    
    // Subscribe to real-time updates
    this.subscription.add(
      this.wsService.alarms$.subscribe(() => {
        this.loadAlarmStats();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadData(): void {
    this.loadStationStats();
    this.loadDeviceStats();
    this.loadAlarmStats();
    this.loadStations();
    this.updateLastUpdate();
  }

  private loadStationStats(): void {
    this.stationsService.getStatistics().subscribe({
      next: (stats) => this.stationStats.set(stats),
      error: (err) => console.error('Failed to load station stats:', err)
    });
  }

  private loadDeviceStats(): void {
    this.devicesService.getStatistics().subscribe({
      next: (stats) => this.deviceStats.set(stats),
      error: (err) => console.error('Failed to load device stats:', err)
    });
  }

  private loadAlarmStats(): void {
    this.alarmsService.getStatistics().subscribe({
      next: (stats) => {
        this.alarmStats.set(stats);
        this.recentAlarms.set(stats.recentAlarms || []);
      },
      error: (err) => console.error('Failed to load alarm stats:', err)
    });
  }

  private loadStations(): void {
    this.stationsService.getAll({ limit: 10 }).subscribe({
      next: (response) => this.stations.set(response.data),
      error: (err) => console.error('Failed to load stations:', err)
    });
  }

  private updateLastUpdate(): void {
    this.lastUpdate.set(new Date().toLocaleTimeString('ar-SA'));
  }
}
