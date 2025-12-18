import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DevicesService, WebSocketService } from '../../core/services';
import { Device, DataPoint, Reading, LiveReading } from '../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-gray-500">
        <a routerLink="/devices" class="hover:text-primary-600">الأجهزة</a>
        <span>/</span>
        <span class="text-gray-900 dark:text-white">{{ device()?.name }}</span>
      </nav>

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      } @else if (device()) {
        <!-- Device Header -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl flex items-center justify-center"
                   [class.bg-green-100]="device()?.status === 'active'"
                   [class.bg-red-100]="device()?.status === 'faulty'"
                   [class.bg-yellow-100]="device()?.status === 'maintenance'">
                <svg class="w-8 h-8" 
                     [class.text-green-600]="device()?.status === 'active'"
                     [class.text-red-600]="device()?.status === 'faulty'"
                     [class.text-yellow-600]="device()?.status === 'maintenance'"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ device()?.name }}</h1>
                <p class="text-gray-500">{{ device()?.code }} | {{ device()?.station?.name }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-sm"
                    [class.bg-green-100]="device()?.status === 'active'"
                    [class.text-green-800]="device()?.status === 'active'"
                    [class.bg-red-100]="device()?.status === 'faulty'"
                    [class.text-red-800]="device()?.status === 'faulty'"
                    [class.bg-yellow-100]="device()?.status === 'maintenance'"
                    [class.text-yellow-800]="device()?.status === 'maintenance'">
                {{ getStatusLabel(device()?.status!) }}
              </span>
            </div>
          </div>

          <!-- Device Info Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-6 pt-6 border-t dark:border-gray-700">
            <div>
              <p class="text-sm text-gray-500">النوع</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ getTypeLabel(device()?.type!) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">الشركة المصنعة</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ device()?.manufacturer || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">الموديل</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ device()?.model || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">الرقم التسلسلي</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ device()?.serialNo || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">السعة</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ device()?.ratedCapacity || '-' }} kVA</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">تاريخ التركيب</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ device()?.installDate | date:'shortDate' }}</p>
            </div>
          </div>
        </div>

        <!-- Live Readings -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div class="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">القراءات الحية</h2>
            <span class="text-sm text-gray-500">آخر تحديث: {{ lastUpdate() }}</span>
          </div>
          <div class="p-4">
            @if (liveReadings().length === 0) {
              <p class="text-center text-gray-500 py-8">لا توجد قراءات</p>
            } @else {
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                @for (item of liveReadings(); track item.dataPoint.id) {
                  <div class="p-4 border rounded-lg dark:border-gray-700"
                       [class.border-red-300]="isAlarm(item)"
                       [class.bg-red-50]="isAlarm(item)">
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.dataPoint.name }}</p>
                    <div class="flex items-baseline gap-2 mt-1">
                      <span class="text-2xl font-bold text-gray-900 dark:text-white"
                            [class.text-red-600]="isAlarm(item)">
                        {{ item.reading?.value?.toFixed(2) || '-' }}
                      </span>
                      <span class="text-sm text-gray-500">{{ item.dataPoint.unit }}</span>
                    </div>
                    @if (item.dataPoint.minValue !== null && item.dataPoint.maxValue !== null) {
                      <div class="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-primary-500 rounded-full transition-all"
                             [style.width.%]="getPercentage(item)"></div>
                      </div>
                      <div class="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{{ item.dataPoint.minValue }}</span>
                        <span>{{ item.dataPoint.maxValue }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Data Points -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div class="p-4 border-b dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">نقاط القياس</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr class="text-right text-sm text-gray-500 dark:text-gray-300">
                  <th class="p-4 font-medium">الكود</th>
                  <th class="p-4 font-medium">الاسم</th>
                  <th class="p-4 font-medium">النوع</th>
                  <th class="p-4 font-medium">الوحدة</th>
                  <th class="p-4 font-medium">الحد الأدنى</th>
                  <th class="p-4 font-medium">الحد الأقصى</th>
                  <th class="p-4 font-medium">عنوان Modbus</th>
                  <th class="p-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                @for (dp of dataPoints(); track dp.id) {
                  <tr class="border-t dark:border-gray-700">
                    <td class="p-4 font-mono text-gray-900 dark:text-white">{{ dp.code }}</td>
                    <td class="p-4 text-gray-900 dark:text-white">{{ dp.name }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ getDataTypeLabel(dp.dataType) }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ dp.unit || '-' }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ dp.minValue ?? '-' }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ dp.maxValue ?? '-' }}</td>
                    <td class="p-4 font-mono text-gray-600 dark:text-gray-300">{{ dp.modbusAddress ?? '-' }}</td>
                    <td class="p-4">
                      <span class="px-2 py-1 text-xs rounded-full"
                            [class.bg-green-100]="dp.isActive"
                            [class.text-green-800]="dp.isActive"
                            [class.bg-gray-100]="!dp.isActive"
                            [class.text-gray-800]="!dp.isActive">
                        {{ dp.isActive ? 'نشط' : 'غير نشط' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class DeviceDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private devicesService = inject(DevicesService);
  private wsService = inject(WebSocketService);

  device = signal<Device | null>(null);
  dataPoints = signal<DataPoint[]>([]);
  liveReadings = signal<LiveReading[]>([]);
  loading = signal(true);
  lastUpdate = signal('');

  private subscription = new Subscription();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDevice(id);
      this.wsService.subscribeToReadings(id);
      
      this.subscription.add(
        this.wsService.readings$.subscribe(() => {
          this.loadLatestReadings(id);
        })
      );
    }
  }

  ngOnDestroy(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.wsService.unsubscribeFromReadings(id);
    }
    this.subscription.unsubscribe();
  }

  private loadDevice(id: string): void {
    this.loading.set(true);
    this.devicesService.getById(id).subscribe({
      next: (device) => {
        this.device.set(device);
        this.loadDataPoints(id);
        this.loadLatestReadings(id);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load device:', err);
        this.loading.set(false);
      }
    });
  }

  private loadDataPoints(id: string): void {
    this.devicesService.getDataPoints(id).subscribe({
      next: (dataPoints) => this.dataPoints.set(dataPoints)
    });
  }

  private loadLatestReadings(id: string): void {
    this.devicesService.getLatestReadings(id).subscribe({
      next: (readings) => {
        this.liveReadings.set(readings);
        this.lastUpdate.set(new Date().toLocaleTimeString('ar-SA'));
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      faulty: 'معطل',
      maintenance: 'صيانة',
      inactive: 'غير نشط'
    };
    return labels[status] || status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      transformer: 'محول',
      breaker: 'قاطع',
      meter: 'عداد',
      feeder: 'مغذي',
      panel: 'لوحة'
    };
    return labels[type] || type;
  }

  getDataTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      analog: 'تناظري',
      digital: 'رقمي',
      counter: 'عداد'
    };
    return labels[type] || type;
  }

  isAlarm(item: LiveReading): boolean {
    if (!item.reading || (item.dataPoint.alarmHigh === null && item.dataPoint.alarmLow === null)) {
      return false;
    }
    const value = item.reading.value;
    const alarmHigh = item.dataPoint.alarmHigh;
    const alarmLow = item.dataPoint.alarmLow;
    if (alarmHigh !== null && alarmHigh !== undefined && value > alarmHigh) return true;
    if (alarmLow !== null && alarmLow !== undefined && value < alarmLow) return true;
    return false;
  }

  getPercentage(item: LiveReading): number {
    if (!item.reading || item.dataPoint.minValue === null || item.dataPoint.maxValue === null) {
      return 0;
    }
    const range = Number(item.dataPoint.maxValue) - Number(item.dataPoint.minValue);
    const value = item.reading.value - Number(item.dataPoint.minValue);
    return Math.min(100, Math.max(0, (value / range) * 100));
  }
}
