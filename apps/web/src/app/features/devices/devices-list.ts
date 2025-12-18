import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DevicesService, DeviceQuery } from '../../core/services';
import { Device, DeviceType, DeviceStatus } from '../../core/models';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">الأجهزة والمعدات</h1>
        <button class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          إضافة جهاز
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" 
                 [(ngModel)]="filters.search" 
                 (ngModelChange)="onFilterChange()"
                 placeholder="بحث..."
                 class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          
          <select [(ngModel)]="filters.type" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الأنواع</option>
            <option value="transformer">محول</option>
            <option value="breaker">قاطع</option>
            <option value="meter">عداد</option>
            <option value="feeder">مغذي</option>
            <option value="panel">لوحة</option>
          </select>

          <select [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="faulty">معطل</option>
            <option value="maintenance">صيانة</option>
            <option value="inactive">غير نشط</option>
          </select>

          <button (click)="resetFilters()" 
                  class="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            إعادة تعيين
          </button>
        </div>
      </div>

      <!-- Devices Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        } @else if (devices().length === 0) {
          <div class="p-12 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">لا توجد أجهزة</h3>
            <p class="mt-2 text-gray-500">لم يتم العثور على أجهزة تطابق معايير البحث</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr class="text-right text-sm text-gray-500 dark:text-gray-300">
                  <th class="p-4 font-medium">الحالة</th>
                  <th class="p-4 font-medium">الكود</th>
                  <th class="p-4 font-medium">الاسم</th>
                  <th class="p-4 font-medium">النوع</th>
                  <th class="p-4 font-medium">المحطة</th>
                  <th class="p-4 font-medium">الشركة المصنعة</th>
                  <th class="p-4 font-medium">نقاط القياس</th>
                  <th class="p-4 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (device of devices(); track device.id) {
                  <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="p-4">
                      <span class="w-3 h-3 inline-block rounded-full"
                            [class.bg-green-500]="device.status === 'active'"
                            [class.bg-red-500]="device.status === 'faulty'"
                            [class.bg-yellow-500]="device.status === 'maintenance'"
                            [class.bg-gray-400]="device.status === 'inactive'"></span>
                    </td>
                    <td class="p-4 font-mono text-gray-900 dark:text-white">{{ device.code }}</td>
                    <td class="p-4 text-gray-900 dark:text-white">{{ device.name }}</td>
                    <td class="p-4">
                      <span class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                        {{ getTypeLabel(device.type) }}
                      </span>
                    </td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ device.station?.name }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ device.manufacturer || '-' }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ device._count?.dataPoints || 0 }}</td>
                    <td class="p-4">
                      <a [routerLink]="['/devices', device.id]" 
                         class="text-primary-600 hover:underline">عرض</a>
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
                صفحة {{ currentPage() }} من {{ totalPages() }}
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
export class DevicesListComponent implements OnInit {
  private devicesService = inject(DevicesService);

  devices = signal<Device[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  
  filters: DeviceQuery = {
    page: 1,
    limit: 20,
    search: '',
    type: '',
    status: ''
  };

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading.set(true);
    this.devicesService.getAll(this.filters).subscribe({
      next: (response) => {
        this.devices.set(response.data);
        this.currentPage.set(response.meta.page);
        this.totalPages.set(response.meta.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load devices:', err);
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadDevices();
  }

  resetFilters(): void {
    this.filters = { page: 1, limit: 20, search: '', type: '', status: '' };
    this.loadDevices();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.filters.page = page;
      this.loadDevices();
    }
  }

  getTypeLabel(type: DeviceType): string {
    const labels: Record<DeviceType, string> = {
      transformer: 'محول',
      breaker: 'قاطع',
      meter: 'عداد',
      feeder: 'مغذي',
      panel: 'لوحة'
    };
    return labels[type] || type;
  }
}
