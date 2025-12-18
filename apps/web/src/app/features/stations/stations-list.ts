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
      <!-- Page Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">المحطات الكهربائية</h1>
          <p class="text-slate-500 mt-1">إدارة ومراقبة جميع المحطات في الشبكة</p>
        </div>
        <button class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          إضافة محطة جديدة
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 font-medium">إجمالي المحطات</p>
              <p class="text-3xl font-bold text-slate-800 mt-1">{{ totalStations() }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 font-medium">متصلة</p>
              <p class="text-3xl font-bold text-emerald-600 mt-1">{{ onlineStations() }}</p>
            </div>
            <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 font-medium">غير متصلة</p>
              <p class="text-3xl font-bold text-red-600 mt-1">{{ offlineStations() }}</p>
            </div>
            <div class="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 font-medium">قيد الصيانة</p>
              <p class="text-3xl font-bold text-amber-600 mt-1">{{ maintenanceStations() }}</p>
            </div>
            <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="relative">
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" 
                   [(ngModel)]="filters.search" 
                   (ngModelChange)="onFilterChange()"
                   placeholder="بحث عن محطة..."
                   class="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
          </div>
          
          <select [(ngModel)]="filters.type" (ngModelChange)="onFilterChange()"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer">
            <option value="">جميع الأنواع</option>
            <option value="main">رئيسية</option>
            <option value="sub">فرعية</option>
            <option value="distribution">توزيعية</option>
            <option value="solar">شمسية</option>
          </select>

          <select [(ngModel)]="filters.voltage" (ngModelChange)="onFilterChange()"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer">
            <option value="">جميع الجهود</option>
            <option value="33kv">33 كيلو فولت</option>
            <option value="11kv">11 كيلو فولت</option>
            <option value="0.4kv">0.4 كيلو فولت</option>
          </select>

          <select [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer">
            <option value="">جميع الحالات</option>
            <option value="online">متصل</option>
            <option value="offline">غير متصل</option>
            <option value="maintenance">صيانة</option>
          </select>

          <button (click)="resetFilters()" 
                  class="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            إعادة تعيين
          </button>
        </div>
      </div>

      <!-- Stations Grid -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p class="mt-4 text-slate-500">جاري تحميل المحطات...</p>
        </div>
      } @else if (stations().length === 0) {
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 class="mt-6 text-lg font-semibold text-slate-800">لا توجد محطات</h3>
          <p class="mt-2 text-slate-500">لم يتم العثور على محطات تطابق معايير البحث</p>
          <button (click)="resetFilters()" class="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            إعادة تعيين الفلاتر
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          @for (station of stations(); track station.id) {
            <a [routerLink]="['/stations', station.id]" 
               class="group bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
              
              <!-- Card Header -->
              <div class="p-5 border-b border-slate-100">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <span class="w-3 h-3 rounded-full block"
                            [class.bg-emerald-500]="station.status === 'online'"
                            [class.bg-red-500]="station.status === 'offline'"
                            [class.bg-amber-500]="station.status === 'maintenance'"></span>
                      @if (station.status === 'online') {
                        <span class="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                      }
                    </div>
                    <div>
                      <h3 class="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{{ station.name }}</h3>
                      <p class="text-sm text-slate-500">{{ station.code }}</p>
                    </div>
                  </div>
                  <span class="px-3 py-1 text-xs font-semibold rounded-lg"
                        [class.bg-blue-100]="station.type === 'main'"
                        [class.text-blue-700]="station.type === 'main'"
                        [class.bg-emerald-100]="station.type === 'sub'"
                        [class.text-emerald-700]="station.type === 'sub'"
                        [class.bg-purple-100]="station.type === 'distribution'"
                        [class.text-purple-700]="station.type === 'distribution'"
                        [class.bg-amber-100]="station.type === 'solar'"
                        [class.text-amber-700]="station.type === 'solar'">
                    {{ getTypeLabel(station.type) }}
                  </span>
                </div>
              </div>

              <!-- Card Body -->
              <div class="p-5">
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 rounded-xl p-3">
                    <p class="text-xs text-slate-500 font-medium">الجهد</p>
                    <p class="text-lg font-bold text-slate-800 mt-0.5">{{ formatVoltage(station.voltage) }}</p>
                  </div>
                  <div class="bg-slate-50 rounded-xl p-3">
                    <p class="text-xs text-slate-500 font-medium">السعة</p>
                    <p class="text-lg font-bold text-slate-800 mt-0.5">{{ station.capacity || '-' }} <span class="text-sm font-normal">MVA</span></p>
                  </div>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2 text-slate-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                  </svg>
                  <span class="text-sm font-medium">{{ station._count?.devices || 0 }} جهاز</span>
                </div>
                @if ((station._count?.alarms || 0) > 0) {
                  <div class="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <span class="text-xs font-bold">{{ station._count?.alarms }} تنبيه</span>
                  </div>
                }
              </div>
            </a>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-2 mt-8">
            <button (click)="goToPage(currentPage() - 1)" 
                    [disabled]="currentPage() === 1"
                    class="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium text-slate-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              السابق
            </button>
            <div class="flex items-center gap-1">
              @for (page of getPageNumbers(); track page) {
                <button (click)="goToPage(page)"
                        class="w-10 h-10 rounded-xl font-medium transition-all"
                        [class.bg-blue-600]="page === currentPage()"
                        [class.text-white]="page === currentPage()"
                        [class.bg-white]="page !== currentPage()"
                        [class.text-slate-700]="page !== currentPage()"
                        [class.hover:bg-slate-50]="page !== currentPage()"
                        [class.border]="page !== currentPage()"
                        [class.border-slate-200]="page !== currentPage()">
                  {{ page }}
                </button>
              }
            </div>
            <button (click)="goToPage(currentPage() + 1)" 
                    [disabled]="currentPage() === totalPages()"
                    class="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium text-slate-700">
              التالي
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
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
  totalStations = signal(0);
  onlineStations = signal(0);
  offlineStations = signal(0);
  maintenanceStations = signal(0);
  
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
        this.totalStations.set(response.meta.total);
        
        // Calculate stats
        const online = response.data.filter(s => s.status === 'online').length;
        const offline = response.data.filter(s => s.status === 'offline').length;
        const maintenance = response.data.filter(s => s.status === 'maintenance').length;
        
        this.onlineStations.set(online);
        this.offlineStations.set(offline);
        this.maintenanceStations.set(maintenance);
        
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

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
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

  formatVoltage(voltage: string): string {
    const voltageMap: Record<string, string> = {
      '33kv': '33 ك.ف',
      '11kv': '11 ك.ف',
      '0.4kv': '0.4 ك.ف'
    };
    return voltageMap[voltage] || voltage;
  }
}
