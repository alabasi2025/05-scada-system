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
      <!-- Welcome Banner -->
      <div class="bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-4 right-4 w-32 h-32 border-4 border-white rounded-full"></div>
          <div class="absolute bottom-4 left-4 w-24 h-24 border-4 border-white rounded-full"></div>
          <div class="absolute top-1/2 left-1/3 w-16 h-16 border-4 border-white rounded-full"></div>
        </div>
        <div class="relative">
          <h1 class="text-3xl font-bold">مرحباً بك في نظام SCADA</h1>
          <p class="text-blue-100 mt-2 text-lg">نظام المراقبة والتحكم في شبكة الكهرباء</p>
          <div class="flex flex-wrap gap-4 mt-6">
            <div class="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p class="text-blue-200 text-sm">آخر تحديث</p>
              <p class="text-xl font-bold">{{ lastUpdate() }}</p>
            </div>
            <div class="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p class="text-blue-200 text-sm">حالة الاتصال</p>
              <p class="text-xl font-bold flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" 
                      [class.bg-emerald-400]="wsService.isConnected()"
                      [class.bg-red-400]="!wsService.isConnected()"
                      [class.animate-pulse]="wsService.isConnected()"></span>
                {{ wsService.isConnected() ? 'متصل' : 'غير متصل' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Stations Card -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500">المحطات</p>
              <p class="text-4xl font-bold text-slate-800 mt-2">{{ stationStats()?.total || 0 }}</p>
              <div class="mt-3 flex items-center gap-3 text-sm">
                <span class="flex items-center gap-1.5 text-emerald-600">
                  <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  {{ stationStats()?.byStatus?.['online'] || 0 }}
                </span>
                <span class="flex items-center gap-1.5 text-red-600">
                  <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                  {{ stationStats()?.byStatus?.['offline'] || 0 }}
                </span>
              </div>
            </div>
            <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Devices Card -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500">الأجهزة</p>
              <p class="text-4xl font-bold text-slate-800 mt-2">{{ deviceStats()?.total || 0 }}</p>
              <div class="mt-3 flex items-center gap-3 text-sm">
                <span class="flex items-center gap-1.5 text-emerald-600">
                  <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  {{ deviceStats()?.byStatus?.['active'] || deviceStats()?.byStatus?.['online'] || 0 }}
                </span>
                <span class="flex items-center gap-1.5 text-amber-600">
                  <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
                  {{ deviceStats()?.byStatus?.['maintenance'] || 0 }}
                </span>
              </div>
            </div>
            <div class="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Alarms Card -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500">التنبيهات النشطة</p>
              <p class="text-4xl font-bold mt-2" 
                 [class.text-red-600]="(alarmStats()?.active || 0) > 0"
                 [class.text-slate-800]="(alarmStats()?.active || 0) === 0">
                {{ alarmStats()?.active || 0 }}
              </p>
              <div class="mt-3 flex items-center gap-3 text-sm">
                <span class="flex items-center gap-1.5 text-red-600">
                  حرج: {{ alarmStats()?.bySeverity?.['critical'] || 0 }}
                </span>
                <span class="flex items-center gap-1.5 text-amber-600">
                  تحذير: {{ alarmStats()?.bySeverity?.['warning'] || 0 }}
                </span>
              </div>
            </div>
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                 [class.bg-gradient-to-br]="true"
                 [class.from-red-500]="(alarmStats()?.active || 0) > 0"
                 [class.to-red-600]="(alarmStats()?.active || 0) > 0"
                 [class.from-emerald-500]="(alarmStats()?.active || 0) === 0"
                 [class.to-emerald-600]="(alarmStats()?.active || 0) === 0">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- System Health Card -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500">صحة النظام</p>
              <p class="text-4xl font-bold text-emerald-600 mt-2">{{ systemHealth() }}%</p>
              <div class="w-full bg-slate-100 rounded-full h-2 mt-3">
                <div class="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                     [style.width.%]="systemHealth()"></div>
              </div>
            </div>
            <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Alarms -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-800">آخر التنبيهات</h2>
              <p class="text-sm text-slate-500">التنبيهات الأخيرة في النظام</p>
            </div>
            <a routerLink="/alarms" class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              عرض الكل
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
          </div>
          <div class="divide-y divide-slate-100">
            <ng-container *ngIf="recentAlarms().length === 0">
              <div class="p-12 text-center">
                <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p class="mt-4 text-slate-600 font-medium">لا توجد تنبيهات نشطة</p>
                <p class="text-sm text-slate-500">النظام يعمل بشكل طبيعي</p>
              </div>
            </ng-container>
            <ng-container *ngFor="let alarm of recentAlarms()">
              <div class="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     [ngClass]="{
                       'bg-red-100': alarm.severity === 'critical',
                       'bg-orange-100': alarm.severity === 'major',
                       'bg-amber-100': alarm.severity === 'warning',
                       'bg-blue-100': alarm.severity === 'minor'
                     }">
                  <svg class="w-5 h-5"
                       [ngClass]="{
                         'text-red-600': alarm.severity === 'critical',
                         'text-orange-600': alarm.severity === 'major',
                         'text-amber-600': alarm.severity === 'warning',
                         'text-blue-600': alarm.severity === 'minor'
                       }"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-800">{{ alarm.message }}</p>
                  <p class="text-sm text-slate-500 mt-0.5">{{ alarm.station?.name || 'غير محدد' }}</p>
                </div>
                <span class="text-xs text-slate-400 flex-shrink-0">{{ formatTime(alarm.triggeredAt) }}</span>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Quick Actions & Stations -->
        <div class="space-y-6">
          <!-- Quick Actions -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-5 border-b border-slate-100">
              <h2 class="text-lg font-bold text-slate-800">الوصول السريع</h2>
            </div>
            <div class="p-3 space-y-2">
              <a routerLink="/stations" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <span class="font-medium text-slate-700">المحطات</span>
                <svg class="w-4 h-4 text-slate-400 mr-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </a>
              <a routerLink="/devices" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div class="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                  <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                  </svg>
                </div>
                <span class="font-medium text-slate-700">الأجهزة</span>
                <svg class="w-4 h-4 text-slate-400 mr-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </a>
              <a routerLink="/reports" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <span class="font-medium text-slate-700">التقارير</span>
                <svg class="w-4 h-4 text-slate-400 mr-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </a>
              <a routerLink="/map" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                </div>
                <span class="font-medium text-slate-700">الخريطة</span>
                <svg class="w-4 h-4 text-slate-400 mr-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Stations List -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 class="text-lg font-bold text-slate-800">المحطات</h2>
              <a routerLink="/stations" class="text-blue-600 hover:text-blue-700 text-sm font-medium">الكل</a>
            </div>
            <div class="divide-y divide-slate-100">
              <ng-container *ngFor="let station of stations().slice(0, 4)">
                <a [routerLink]="['/stations', station.id]" 
                   class="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div class="relative">
                    <span class="w-3 h-3 rounded-full block"
                          [ngClass]="{
                            'bg-emerald-500': station.status === 'online',
                            'bg-red-500': station.status === 'offline',
                            'bg-amber-500': station.status === 'maintenance'
                          }"></span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-slate-800 truncate">{{ station.name }}</p>
                    <p class="text-xs text-slate-500">{{ station.code }}</p>
                  </div>
                  <div class="text-left">
                    <p class="text-sm text-slate-600">{{ station._count?.devices || 0 }} جهاز</p>
                  </div>
                </a>
              </ng-container>
            </div>
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
  systemHealth = signal(98);

  private subscription = new Subscription();

  ngOnInit(): void {
    this.loadData();
    
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
      next: (stats) => {
        this.stationStats.set(stats);
        const total = stats.total || 0;
        const online = stats.byStatus?.['online'] || 0;
        if (total > 0) {
          this.systemHealth.set(Math.round((online / total) * 100));
        }
      },
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
    this.lastUpdate.set(new Date().toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    }));
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return 'منذ ' + minutes + ' دقيقة';
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return 'منذ ' + hours + ' ساعة';
    
    return d.toLocaleDateString('ar-SA');
  }
}
