import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, StationsService } from '../../core/services';
import { Station } from '../../core/models';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">التقارير</h1>
      </div>

      <!-- Report Types -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (report of reportTypes; track report.id) {
          <button (click)="selectReport(report)"
                  class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow text-right"
                  [class.ring-2]="selectedReport()?.id === report.id"
                  [class.ring-primary-500]="selectedReport()?.id === report.id">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span [innerHTML]="report.icon" class="text-primary-600 dark:text-primary-400"></span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ report.name }}</h3>
                <p class="text-sm text-gray-500 mt-1">{{ report.description }}</p>
              </div>
            </div>
          </button>
        }
      </div>

      <!-- Report Configuration -->
      @if (selectedReport()) {
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">إعدادات التقرير</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Station Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المحطة</label>
              <select [(ngModel)]="reportConfig.stationId"
                      class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">جميع المحطات</option>
                @for (station of stations(); track station.id) {
                  <option [value]="station.id">{{ station.name }}</option>
                }
              </select>
            </div>

            <!-- Start Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من تاريخ</label>
              <input type="date" [(ngModel)]="reportConfig.startDate"
                     class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            </div>

            <!-- End Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ</label>
              <input type="date" [(ngModel)]="reportConfig.endDate"
                     class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            </div>

            <!-- Format -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصيغة</label>
              <select [(ngModel)]="reportConfig.format"
                      class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-4 mt-6">
            <button (click)="generateReport()" 
                    [disabled]="generating()"
                    class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
              @if (generating()) {
                <span class="flex items-center gap-2">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الإنشاء...
                </span>
              } @else {
                إنشاء التقرير
              }
            </button>
            <button (click)="previewReport()" 
                    class="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              معاينة
            </button>
          </div>
        </div>
      }

      <!-- Recent Reports -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div class="p-4 border-b dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">التقارير الأخيرة</h2>
        </div>
        <div class="p-4">
          @if (recentReports().length === 0) {
            <p class="text-center text-gray-500 py-8">لا توجد تقارير سابقة</p>
          } @else {
            <div class="space-y-3">
              @for (report of recentReports(); track report.id) {
                <div class="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">{{ report.name }}</p>
                      <p class="text-sm text-gray-500">{{ report.createdAt | date:'medium' }}</p>
                    </div>
                  </div>
                  <button class="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    تحميل
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  private stationsService = inject(StationsService);

  stations = signal<Station[]>([]);
  selectedReport = signal<ReportType | null>(null);
  recentReports = signal<any[]>([]);
  generating = signal(false);

  reportConfig = {
    stationId: '',
    startDate: '',
    endDate: '',
    format: 'pdf'
  };

  reportTypes: ReportType[] = [
    {
      id: 'energy',
      name: 'تقرير استهلاك الطاقة',
      description: 'تقرير تفصيلي عن استهلاك الطاقة الكهربائية',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>'
    },
    {
      id: 'alarms',
      name: 'تقرير التنبيهات',
      description: 'ملخص التنبيهات والإنذارات خلال فترة محددة',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
    },
    {
      id: 'performance',
      name: 'تقرير الأداء',
      description: 'تحليل أداء المحطات والأجهزة',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>'
    },
    {
      id: 'maintenance',
      name: 'تقرير الصيانة',
      description: 'سجل عمليات الصيانة والإصلاح',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>'
    },
    {
      id: 'commands',
      name: 'تقرير أوامر التحكم',
      description: 'سجل جميع أوامر التحكم المرسلة',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
    },
    {
      id: 'summary',
      name: 'التقرير الشامل',
      description: 'ملخص شامل لحالة النظام',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
    }
  ];

  ngOnInit(): void {
    this.loadStations();
    this.setDefaultDates();
  }

  private loadStations(): void {
    this.stationsService.getAll({ limit: 100 }).subscribe({
      next: (response) => this.stations.set(response.data)
    });
  }

  private setDefaultDates(): void {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    this.reportConfig.endDate = today.toISOString().split('T')[0];
    this.reportConfig.startDate = lastMonth.toISOString().split('T')[0];
  }

  selectReport(report: ReportType): void {
    this.selectedReport.set(report);
  }

  generateReport(): void {
    if (!this.selectedReport()) return;
    
    this.generating.set(true);
    // Simulate report generation
    setTimeout(() => {
      this.generating.set(false);
      alert('تم إنشاء التقرير بنجاح');
    }, 2000);
  }

  previewReport(): void {
    if (!this.selectedReport()) return;
    alert('معاينة التقرير');
  }
}
