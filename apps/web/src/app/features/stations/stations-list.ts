import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StationsService, StationQuery } from '../../core/services';
import { Station, StationType, StationStatus, StationVoltage } from '../../core/models';

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">المحطات الكهربائية</h1>
        <button class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          إضافة محطة
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input type="text" 
                 [(ngModel)]="filters.search" 
                 (ngModelChange)="onFilterChange()"
                 placeholder="بحث..."
                 class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          
          <select [(ngModel)]="filters.type" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الأنواع</option>
            <option value="main">رئيسية</option>
            <option value="sub">فرعية</option>
            <option value="distribution">توزيعية</option>
            <option value="solar">شمسية</option>
          </select>

          <select [(ngModel)]="filters.voltage" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الجهود</option>
            <option value="33kv">33 كيلو فولت</option>
            <option value="11kv">11 كيلو فولت</option>
            <option value="0.4kv">0.4 كيلو فولت</option>
          </select>

          <select [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الحالات</option>
            <option value="online">متصل</option>
            <option value="offline">غير متصل</option>
            <option value="maintenance">صيانة</option>
          </select>

          <button (click)="resetFilters()" 
                  class="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            إعادة تعيين
          </button>
        </div>
      </div>

      <!-- Stations Grid -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      } @else if (stations().length === 0) {
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">لا توجد محطات</h3>
          <p class="mt-2 text-gray-500">لم يتم العثور على محطات تطابق معايير البحث</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (station of stations(); track station.id) {
            <a [routerLink]="['/stations', station.id]" 
               class="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow p-6">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full"
                          [class.bg-green-500]="station.status === 'online'"
                          [class.bg-red-500]="station.status === 'offline'"
                          [class.bg-yellow-500]="station.status === 'maintenance'"></span>
                    <h3 class="font-semibold text-gray-900 dark:text-white">{{ station.name }}</h3>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">{{ station.code }}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full"
                      [class.bg-blue-100]="station.type === 'main'"
                      [class.text-blue-800]="station.type === 'main'"
                      [class.bg-green-100]="station.type === 'sub'"
                      [class.text-green-800]="station.type === 'sub'"
                      [class.bg-purple-100]="station.type === 'distribution'"
                      [class.text-purple-800]="station.type === 'distribution'"
                      [class.bg-yellow-100]="station.type === 'solar'"
                      [class.text-yellow-800]="station.type === 'solar'">
                  {{ getTypeLabel(station.type) }}
                </span>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-500">الجهد</p>
                  <p class="font-medium text-gray-900 dark:text-white">{{ station.voltage }}</p>
                </div>
                <div>
                  <p class="text-gray-500">السعة</p>
                  <p class="font-medium text-gray-900 dark:text-white">{{ station.capacity || '-' }} MVA</p>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between text-sm">
                <span class="text-gray-500">{{ station._count?.devices || 0 }} جهاز</span>
                @if ((station._count?.alarms || 0) > 0) {
                  <span class="flex items-center gap-1 text-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {{ station._count?.alarms }} تنبيه
                  </span>
                }
              </div>
            </a>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-2 mt-6">
            <button (click)="goToPage(currentPage() - 1)" 
                    [disabled]="currentPage() === 1"
                    class="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700">
              السابق
            </button>
            <span class="px-4 py-2 text-gray-600 dark:text-gray-300">
              صفحة {{ currentPage() }} من {{ totalPages() }}
            </span>
            <button (click)="goToPage(currentPage() + 1)" 
                    [disabled]="currentPage() === totalPages()"
                    class="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700">
              التالي
            </button>
          </div>
        }
      }
    </div>
  `
})
export class StationsListComponent implements OnInit {
  private stationsService = inject(StationsService);

  stations = signal<Station[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  
  filters: StationQuery = {
    page: 1,
    limit: 12,
    search: '',
    type: '',
    status: '',
    voltage: ''
  };

  ngOnInit(): void {
    this.loadStations();
  }

  loadStations(): void {
    this.loading.set(true);
    this.stationsService.getAll(this.filters).subscribe({
      next: (response) => {
        this.stations.set(response.data);
        this.currentPage.set(response.meta.page);
        this.totalPages.set(response.meta.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load stations:', err);
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadStations();
  }

  resetFilters(): void {
    this.filters = { page: 1, limit: 12, search: '', type: '', status: '', voltage: '' };
    this.loadStations();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.filters.page = page;
      this.loadStations();
    }
  }

  getTypeLabel(type: StationType): string {
    const labels: Record<StationType, string> = {
      main: 'رئيسية',
      sub: 'فرعية',
      distribution: 'توزيعية',
      solar: 'شمسية'
    };
    return labels[type] || type;
  }
}
