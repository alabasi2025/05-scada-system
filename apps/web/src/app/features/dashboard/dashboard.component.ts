import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Station {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
}

interface Alert {
  id: string;
  alertNumber: string;
  message: string;
  severity: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TableModule, TagModule, ButtonModule, ProgressSpinnerModule],
  template: `
    <!-- Loading State -->
    <div *ngIf="loading()" class="flex justify-center items-center h-64">
      <p-progressSpinner strokeWidth="4"></p-progressSpinner>
    </div>

    <!-- Error State -->
    <div *ngIf="error()" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>خطأ:</strong> {{ error() }}
    </div>

    <!-- Dashboard Content -->
    <div *ngIf="!loading()">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <div class="stat-icon primary">
            <i class="pi pi-building"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalStations() }}</div>
            <div class="stat-label">إجمالي المحطات</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon success">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ onlineStations() }}</div>
            <div class="stat-label">المحطات المتصلة</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon warning">
            <i class="pi pi-bell"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ activeAlerts() }}</div>
            <div class="stat-label">التنبيهات النشطة</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon danger">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ criticalAlerts() }}</div>
            <div class="stat-label">التنبيهات الحرجة</div>
          </div>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Stations List -->
        <div class="scada-card">
          <div class="scada-card-header">
            <h2 class="scada-card-title">
              <i class="pi pi-building ml-2"></i>
              المحطات
            </h2>
            <a routerLink="/stations" class="text-blue-600 hover:underline text-sm">عرض الكل</a>
          </div>
          
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-right p-2">الكود</th>
                <th class="text-right p-2">الاسم</th>
                <th class="text-right p-2">النوع</th>
                <th class="text-right p-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let station of stationsList()" class="border-b hover:bg-gray-50">
                <td class="p-2 font-mono text-blue-600">{{ station.code }}</td>
                <td class="p-2">{{ station.name }}</td>
                <td class="p-2">{{ getStationType(station.type) }}</td>
                <td class="p-2">
                  <span [class]="getStatusClass(station.status)">{{ getStatusLabel(station.status) }}</span>
                </td>
              </tr>
              <tr *ngIf="stationsList().length === 0">
                <td colspan="4" class="text-center py-4 text-slate-500">لا توجد محطات</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Alerts List -->
        <div class="scada-card">
          <div class="scada-card-header">
            <h2 class="scada-card-title">
              <i class="pi pi-bell ml-2"></i>
              آخر التنبيهات
            </h2>
            <a routerLink="/alerts" class="text-blue-600 hover:underline text-sm">عرض الكل</a>
          </div>
          
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-right p-2">الرقم</th>
                <th class="text-right p-2">الرسالة</th>
                <th class="text-right p-2">الخطورة</th>
                <th class="text-right p-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let alert of alertsList()" class="border-b hover:bg-gray-50">
                <td class="p-2">{{ alert.alertNumber }}</td>
                <td class="p-2">{{ alert.message }}</td>
                <td class="p-2">
                  <span [class]="getSeverityClass(alert.severity)">{{ getSeverityLabel(alert.severity) }}</span>
                </td>
                <td class="p-2">
                  <span [class]="getAlertStatusClass(alert.status)">{{ getAlertStatusLabel(alert.status) }}</span>
                </td>
              </tr>
              <tr *ngIf="alertsList().length === 0">
                <td colspan="4" class="text-center py-4 text-slate-500">لا توجد تنبيهات</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  error = signal<string | null>(null);
  
  totalStations = signal(0);
  onlineStations = signal(0);
  activeAlerts = signal(0);
  criticalAlerts = signal(0);
  
  stationsList = signal<Station[]>([]);
  alertsList = signal<Alert[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    // Load stations directly
    this.http.get<any>(`${this.apiUrl}/v1/scada/stations`).subscribe({
      next: (response) => {
        console.log('Stations API response:', response);
        const stations = response?.data || [];
        this.stationsList.set(stations.slice(0, 5));
        this.totalStations.set(stations.length);
        this.onlineStations.set(stations.filter((s: any) => s.status === 'online').length);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading stations:', err);
        this.error.set('فشل في تحميل المحطات');
        this.loading.set(false);
      }
    });

    // Load alerts
    this.http.get<any>(`${this.apiUrl}/v1/scada/alerts?status=active`).subscribe({
      next: (response) => {
        console.log('Alerts API response:', response);
        const alerts = response?.data || [];
        this.alertsList.set(alerts.slice(0, 5));
        this.activeAlerts.set(alerts.length);
        this.criticalAlerts.set(alerts.filter((a: any) => a.severity === 'critical').length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading alerts:', err);
      }
    });
  }

  getStationType(type: string): string {
    const types: Record<string, string> = {
      main: 'رئيسية',
      substation: 'فرعية',
      distribution: 'توزيعية',
      solar: 'شمسية',
    };
    return types[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      online: 'متصل',
      offline: 'غير متصل',
      maintenance: 'صيانة',
      warning: 'تحذير',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      online: 'bg-green-100 text-green-800 px-2 py-1 rounded text-sm',
      offline: 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm',
      maintenance: 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm',
      warning: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm',
    };
    return classes[status] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm';
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      critical: 'حرج',
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض',
      info: 'معلومات',
    };
    return labels[severity] || severity;
  }

  getSeverityClass(severity: string): string {
    const classes: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm',
      high: 'bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm',
      medium: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm',
      low: 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm',
      info: 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm',
    };
    return classes[severity] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm';
  }

  getAlertStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      acknowledged: 'تم الإقرار',
      cleared: 'تم المسح',
    };
    return labels[status] || status;
  }

  getAlertStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm',
      acknowledged: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm',
      cleared: 'bg-green-100 text-green-800 px-2 py-1 rounded text-sm',
    };
    return classes[status] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm';
  }
}
