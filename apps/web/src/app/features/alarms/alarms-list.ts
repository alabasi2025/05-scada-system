import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlarmsService, AlarmQuery, WebSocketService } from '../../core/services';
import { Alarm, AlarmSeverity, AlarmStatus } from '../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alarms-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">التنبيهات</h1>
          <p class="text-gray-500 mt-1">{{ activeCount() }} تنبيه نشط</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="acknowledgeSelected()" 
                  [disabled]="selectedAlarms().length === 0"
                  class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            الاعتراف بالمحدد ({{ selectedAlarms().length }})
          </button>
          <button (click)="clearSelected()" 
                  [disabled]="selectedAlarms().length === 0"
                  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            مسح المحدد
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="acknowledged">معترف به</option>
            <option value="cleared">تم المسح</option>
          </select>

          <select [(ngModel)]="filters.severity" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الخطورات</option>
            <option value="critical">حرج</option>
            <option value="major">رئيسي</option>
            <option value="minor">ثانوي</option>
            <option value="warning">تحذير</option>
          </select>

          <input type="date" [(ngModel)]="filters.startDate" (ngModelChange)="onFilterChange()"
                 class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">

          <input type="date" [(ngModel)]="filters.endDate" (ngModelChange)="onFilterChange()"
                 class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
      </div>

      <!-- Alarms Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        } @else if (alarms().length === 0) {
          <div class="p-12 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">لا توجد تنبيهات</h3>
            <p class="mt-2 text-gray-500">جميع الأنظمة تعمل بشكل طبيعي</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr class="text-right text-sm text-gray-500 dark:text-gray-300">
                  <th class="p-4">
                    <input type="checkbox" 
                           [checked]="allSelected()"
                           (change)="toggleSelectAll()"
                           class="rounded border-gray-300">
                  </th>
                  <th class="p-4 font-medium">الخطورة</th>
                  <th class="p-4 font-medium">الرسالة</th>
                  <th class="p-4 font-medium">المحطة</th>
                  <th class="p-4 font-medium">الجهاز</th>
                  <th class="p-4 font-medium">القيمة</th>
                  <th class="p-4 font-medium">الحالة</th>
                  <th class="p-4 font-medium">الوقت</th>
                  <th class="p-4 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (alarm of alarms(); track alarm.id) {
                  <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      [class.bg-red-50]="alarm.severity === 'critical' && alarm.status === 'active'"
                      [class.dark:bg-red-900]="alarm.severity === 'critical' && alarm.status === 'active'">
                    <td class="p-4">
                      <input type="checkbox" 
                             [checked]="isSelected(alarm.id)"
                             (change)="toggleSelect(alarm.id)"
                             class="rounded border-gray-300">
                    </td>
                    <td class="p-4">
                      <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                            [class.bg-red-100]="alarm.severity === 'critical'"
                            [class.text-red-800]="alarm.severity === 'critical'"
                            [class.bg-orange-100]="alarm.severity === 'major'"
                            [class.text-orange-800]="alarm.severity === 'major'"
                            [class.bg-yellow-100]="alarm.severity === 'warning' || alarm.severity === 'minor'"
                            [class.text-yellow-800]="alarm.severity === 'warning' || alarm.severity === 'minor'">
                        <span class="w-2 h-2 rounded-full"
                              [class.bg-red-500]="alarm.severity === 'critical'"
                              [class.bg-orange-500]="alarm.severity === 'major'"
                              [class.bg-yellow-500]="alarm.severity === 'warning' || alarm.severity === 'minor'"></span>
                        {{ getSeverityLabel(alarm.severity) }}
                      </span>
                    </td>
                    <td class="p-4 text-gray-900 dark:text-white max-w-xs truncate">{{ alarm.message }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ alarm.station?.name }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ alarm.device?.name || '-' }}</td>
                    <td class="p-4 font-mono text-gray-900 dark:text-white">
                      @if (alarm.value !== null && alarm.value !== undefined) {
                        {{ alarm.value }} / {{ alarm.threshold }}
                      } @else {
                        -
                      }
                    </td>
                    <td class="p-4">
                      <span class="px-2 py-1 rounded-full text-xs font-medium"
                            [class.bg-red-100]="alarm.status === 'active'"
                            [class.text-red-800]="alarm.status === 'active'"
                            [class.bg-yellow-100]="alarm.status === 'acknowledged'"
                            [class.text-yellow-800]="alarm.status === 'acknowledged'"
                            [class.bg-green-100]="alarm.status === 'cleared'"
                            [class.text-green-800]="alarm.status === 'cleared'">
                        {{ getStatusLabel(alarm.status) }}
                      </span>
                    </td>
                    <td class="p-4 text-gray-500 text-sm">{{ alarm.triggeredAt | date:'short' }}</td>
                    <td class="p-4">
                      <div class="flex items-center gap-2">
                        @if (alarm.status === 'active') {
                          <button (click)="acknowledge(alarm)" 
                                  class="p-1 text-yellow-600 hover:bg-yellow-100 rounded" title="اعتراف">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </button>
                        }
                        @if (alarm.status !== 'cleared') {
                          <button (click)="clear(alarm)" 
                                  class="p-1 text-green-600 hover:bg-green-100 rounded" title="مسح">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between p-4 border-t dark:border-gray-700">
              <span class="text-sm text-gray-500">
                عرض {{ (currentPage() - 1) * 20 + 1 }} - {{ Math.min(currentPage() * 20, total()) }} من {{ total() }}
              </span>
              <div class="flex items-center gap-2">
                <button (click)="goToPage(currentPage() - 1)" 
                        [disabled]="currentPage() === 1"
                        class="px-3 py-1 border rounded disabled:opacity-50">السابق</button>
                <button (click)="goToPage(currentPage() + 1)" 
                        [disabled]="currentPage() === totalPages()"
                        class="px-3 py-1 border rounded disabled:opacity-50">التالي</button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class AlarmsListComponent implements OnInit, OnDestroy {
  private alarmsService = inject(AlarmsService);
  private wsService = inject(WebSocketService);

  alarms = signal<Alarm[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  activeCount = signal(0);
  selectedAlarms = signal<string[]>([]);

  Math = Math;

  private subscription = new Subscription();

  filters: AlarmQuery = {
    page: 1,
    limit: 20,
    status: '',
    severity: '',
    startDate: '',
    endDate: ''
  };

  ngOnInit(): void {
    this.loadAlarms();
    this.loadActiveCount();

    this.subscription.add(
      this.wsService.alarms$.subscribe(() => {
        this.loadAlarms();
        this.loadActiveCount();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAlarms(): void {
    this.loading.set(true);
    this.alarmsService.getAll(this.filters).subscribe({
      next: (response) => {
        this.alarms.set(response.data);
        this.currentPage.set(response.meta.page);
        this.totalPages.set(response.meta.totalPages);
        this.total.set(response.meta.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load alarms:', err);
        this.loading.set(false);
      }
    });
  }

  loadActiveCount(): void {
    this.alarmsService.getActive().subscribe({
      next: (alarms) => this.activeCount.set(alarms.length)
    });
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadAlarms();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.filters.page = page;
      this.loadAlarms();
    }
  }

  toggleSelect(id: string): void {
    this.selectedAlarms.update(selected => {
      if (selected.includes(id)) {
        return selected.filter(s => s !== id);
      }
      return [...selected, id];
    });
  }

  isSelected(id: string): boolean {
    return this.selectedAlarms().includes(id);
  }

  allSelected(): boolean {
    return this.alarms().length > 0 && this.alarms().every(a => this.isSelected(a.id));
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedAlarms.set([]);
    } else {
      this.selectedAlarms.set(this.alarms().map(a => a.id));
    }
  }

  acknowledge(alarm: Alarm): void {
    this.alarmsService.acknowledge(alarm.id).subscribe({
      next: () => this.loadAlarms(),
      error: (err) => console.error('Failed to acknowledge alarm:', err)
    });
  }

  clear(alarm: Alarm): void {
    this.alarmsService.clear(alarm.id).subscribe({
      next: () => this.loadAlarms(),
      error: (err) => console.error('Failed to clear alarm:', err)
    });
  }

  acknowledgeSelected(): void {
    const promises = this.selectedAlarms().map(id => 
      this.alarmsService.acknowledge(id).toPromise()
    );
    Promise.all(promises).then(() => {
      this.selectedAlarms.set([]);
      this.loadAlarms();
    });
  }

  clearSelected(): void {
    const promises = this.selectedAlarms().map(id => 
      this.alarmsService.clear(id).toPromise()
    );
    Promise.all(promises).then(() => {
      this.selectedAlarms.set([]);
      this.loadAlarms();
    });
  }

  getSeverityLabel(severity: AlarmSeverity): string {
    const labels: Record<AlarmSeverity, string> = {
      critical: 'حرج',
      major: 'رئيسي',
      minor: 'ثانوي',
      warning: 'تحذير'
    };
    return labels[severity] || severity;
  }

  getStatusLabel(status: AlarmStatus): string {
    const labels: Record<AlarmStatus, string> = {
      active: 'نشط',
      acknowledged: 'معترف به',
      cleared: 'تم المسح'
    };
    return labels[status] || status;
  }
}
