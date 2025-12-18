import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StationsService, WebSocketService } from '../../core/services';
import { Station, Device, Alarm, Reading } from '../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-gray-500">
        <a routerLink="/stations" class="hover:text-primary-600">المحطات</a>
        <span>/</span>
        <span class="text-gray-900 dark:text-white">{{ station()?.name }}</span>
      </nav>

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      } @else if (station()) {
        <!-- Station Header -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl flex items-center justify-center"
                   [class.bg-green-100]="station()?.status === 'online'"
                   [class.bg-red-100]="station()?.status === 'offline'"
                   [class.bg-yellow-100]="station()?.status === 'maintenance'">
                <svg class="w-8 h-8" 
                     [class.text-green-600]="station()?.status === 'online'"
                     [class.text-red-600]="station()?.status === 'offline'"
                     [class.text-yellow-600]="station()?.status === 'maintenance'"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ station()?.name }}</h1>
                <p class="text-gray-500">{{ station()?.code }} | {{ station()?.nameEn }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-sm"
                    [class.bg-green-100]="station()?.status === 'online'"
                    [class.text-green-800]="station()?.status === 'online'"
                    [class.bg-red-100]="station()?.status === 'offline'"
                    [class.text-red-800]="station()?.status === 'offline'"
                    [class.bg-yellow-100]="station()?.status === 'maintenance'"
                    [class.text-yellow-800]="station()?.status === 'maintenance'">
                {{ getStatusLabel(station()?.status!) }}
              </span>
              <button class="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                تعديل
              </button>
            </div>
          </div>

          <!-- Station Info Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t dark:border-gray-700">
            <div>
              <p class="text-sm text-gray-500">النوع</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ getTypeLabel(station()?.type!) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">الجهد</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ station()?.voltage }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">السعة</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ station()?.capacity || '-' }} MVA</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">تاريخ التشغيل</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ station()?.commissionDate | date:'shortDate' }}</p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div class="border-b dark:border-gray-700">
            <nav class="flex gap-4 px-6">
              @for (tab of tabs; track tab.id) {
                <button (click)="activeTab.set(tab.id)"
                        class="px-4 py-4 text-sm font-medium border-b-2 transition-colors"
                        [class.border-primary-600]="activeTab() === tab.id"
                        [class.text-primary-600]="activeTab() === tab.id"
                        [class.border-transparent]="activeTab() !== tab.id"
                        [class.text-gray-500]="activeTab() !== tab.id">
                  {{ tab.label }}
                  @if (tab.count !== undefined) {
                    <span class="mr-2 px-2 py-0.5 text-xs rounded-full"
                          [class.bg-primary-100]="activeTab() === tab.id"
                          [class.bg-gray-100]="activeTab() !== tab.id">
                      {{ tab.count }}
                    </span>
                  }
                </button>
              }
            </nav>
          </div>

          <div class="p-6">
            <!-- Devices Tab -->
            @if (activeTab() === 'devices') {
              @if (devices().length === 0) {
                <p class="text-center text-gray-500 py-8">لا توجد أجهزة</p>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  @for (device of devices(); track device.id) {
                    <a [routerLink]="['/devices', device.id]" 
                       class="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-2 h-2 rounded-full"
                                [class.bg-green-500]="device.status === 'active'"
                                [class.bg-red-500]="device.status === 'faulty'"
                                [class.bg-yellow-500]="device.status === 'maintenance'"></span>
                          <span class="font-medium text-gray-900 dark:text-white">{{ device.name }}</span>
                        </div>
                        <span class="text-xs text-gray-500">{{ device.code }}</span>
                      </div>
                      <p class="text-sm text-gray-500 mt-2">{{ getDeviceTypeLabel(device.type) }}</p>
                    </a>
                  }
                </div>
              }
            }

            <!-- Alarms Tab -->
            @if (activeTab() === 'alarms') {
              @if (alarms().length === 0) {
                <p class="text-center text-gray-500 py-8">لا توجد تنبيهات نشطة</p>
              } @else {
                <div class="space-y-3">
                  @for (alarm of alarms(); track alarm.id) {
                    <div class="flex items-start gap-3 p-4 border rounded-lg">
                      <span class="w-3 h-3 mt-1 rounded-full flex-shrink-0"
                            [class.bg-red-500]="alarm.severity === 'critical'"
                            [class.bg-orange-500]="alarm.severity === 'major'"
                            [class.bg-yellow-500]="alarm.severity === 'warning'"></span>
                      <div class="flex-1">
                        <p class="font-medium text-gray-900 dark:text-white">{{ alarm.message }}</p>
                        <p class="text-sm text-gray-500 mt-1">
                          {{ alarm.device?.name }} | {{ alarm.triggeredAt | date:'medium' }}
                        </p>
                      </div>
                      <span class="px-2 py-1 text-xs rounded-full"
                            [class.bg-red-100]="alarm.status === 'active'"
                            [class.text-red-800]="alarm.status === 'active'"
                            [class.bg-yellow-100]="alarm.status === 'acknowledged'"
                            [class.text-yellow-800]="alarm.status === 'acknowledged'">
                        {{ alarm.status === 'active' ? 'نشط' : 'معترف به' }}
                      </span>
                    </div>
                  }
                </div>
              }
            }

            <!-- Readings Tab -->
            @if (activeTab() === 'readings') {
              @if (readings().length === 0) {
                <p class="text-center text-gray-500 py-8">لا توجد قراءات</p>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="text-right text-sm text-gray-500 border-b dark:border-gray-700">
                        <th class="pb-3 font-medium">الجهاز</th>
                        <th class="pb-3 font-medium">نقطة القياس</th>
                        <th class="pb-3 font-medium">القيمة</th>
                        <th class="pb-3 font-medium">الجودة</th>
                        <th class="pb-3 font-medium">الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (reading of readings(); track reading.id) {
                        <tr class="border-b dark:border-gray-700">
                          <td class="py-3 text-gray-900 dark:text-white">{{ reading.device?.name }}</td>
                          <td class="py-3 text-gray-900 dark:text-white">{{ reading.dataPoint?.name }}</td>
                          <td class="py-3 font-mono text-gray-900 dark:text-white">
                            {{ reading.value }} {{ reading.dataPoint?.unit }}
                          </td>
                          <td class="py-3">
                            <span class="px-2 py-1 text-xs rounded-full"
                                  [class.bg-green-100]="reading.quality === 'good'"
                                  [class.text-green-800]="reading.quality === 'good'"
                                  [class.bg-red-100]="reading.quality === 'bad'"
                                  [class.text-red-800]="reading.quality === 'bad'">
                              {{ reading.quality === 'good' ? 'جيد' : 'سيء' }}
                            </span>
                          </td>
                          <td class="py-3 text-gray-500">{{ reading.timestamp | date:'medium' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `
})
export class StationDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private stationsService = inject(StationsService);
  private wsService = inject(WebSocketService);

  station = signal<Station | null>(null);
  devices = signal<Device[]>([]);
  alarms = signal<Alarm[]>([]);
  readings = signal<Reading[]>([]);
  loading = signal(true);
  activeTab = signal('devices');

  private subscription = new Subscription();

  tabs = [
    { id: 'devices', label: 'الأجهزة', count: 0 },
    { id: 'alarms', label: 'التنبيهات', count: 0 },
    { id: 'readings', label: 'القراءات' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStation(id);
      this.wsService.subscribeToStation(id);
      
      this.subscription.add(
        this.wsService.station$.subscribe(msg => {
          if (msg.type === 'reading') {
            this.loadReadings(id);
          } else if (msg.type === 'alarm') {
            this.loadAlarms(id);
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.wsService.unsubscribeFromStation(id);
    }
    this.subscription.unsubscribe();
  }

  private loadStation(id: string): void {
    this.loading.set(true);
    this.stationsService.getById(id).subscribe({
      next: (station) => {
        this.station.set(station);
        this.loadDevices(id);
        this.loadAlarms(id);
        this.loadReadings(id);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load station:', err);
        this.loading.set(false);
      }
    });
  }

  private loadDevices(id: string): void {
    this.stationsService.getDevices(id).subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.tabs[0].count = devices.length;
      }
    });
  }

  private loadAlarms(id: string): void {
    this.stationsService.getAlarms(id, 'active').subscribe({
      next: (alarms) => {
        this.alarms.set(alarms);
        this.tabs[1].count = alarms.length;
      }
    });
  }

  private loadReadings(id: string): void {
    this.stationsService.getReadings(id).subscribe({
      next: (readings) => this.readings.set(readings)
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      online: 'متصل',
      offline: 'غير متصل',
      maintenance: 'صيانة'
    };
    return labels[status] || status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      main: 'رئيسية',
      sub: 'فرعية',
      distribution: 'توزيعية',
      solar: 'شمسية'
    };
    return labels[type] || type;
  }

  getDeviceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      transformer: 'محول',
      breaker: 'قاطع',
      meter: 'عداد',
      feeder: 'مغذي',
      panel: 'لوحة'
    };
    return labels[type] || type;
  }
}
