import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, TableModule, TagModule, ButtonModule,
    CardModule, Tabs, TabList, Tab, TabPanels, TabPanel, ProgressSpinnerModule, ChartModule
  ],
  template: `
    <div class="scada-card mb-4">
      <div class="flex justify-between items-center mb-4">
        <a routerLink="/stations" class="text-blue-600 hover:underline">
          <i class="pi pi-arrow-right ml-1"></i>
          العودة للقائمة
        </a>
        <button pButton label="تعديل المحطة" icon="pi pi-pencil" class="p-button-outlined"></button>
      </div>

      <div *ngIf="loading()" class="flex justify-center items-center h-64">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
      </div>

      <div *ngIf="error()" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>خطأ:</strong> {{ error() }}
      </div>

      <div *ngIf="station() && !loading()">
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="pi pi-building text-3xl text-blue-600"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold">{{ station()?.name }}</h1>
            <p class="text-slate-500">{{ station()?.nameEn }} | {{ station()?.code }}</p>
          </div>
          <div class="mr-auto">
            <p-tag [severity]="getStatusSeverity(station()?.status)" [value]="getStatusLabel(station()?.status)" class="text-lg"></p-tag>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-blue-600">{{ station()?._count?.devices || 0 }}</div>
            <div class="text-slate-600">الأجهزة</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-green-600">{{ station()?._count?.monitoringPoints || 0 }}</div>
            <div class="text-slate-600">نقاط المراقبة</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-yellow-600">{{ station()?._count?.alerts || 0 }}</div>
            <div class="text-slate-600">التنبيهات</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-purple-600">{{ station()?.capacity || '-' }}</div>
            <div class="text-slate-600">السعة (MVA)</div>
          </div>
        </div>

        <!-- Tabs -->
        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0">معلومات المحطة</p-tab>
            <p-tab value="1">الأجهزة</p-tab>
            <p-tab value="2">التنبيهات</p-tab>
            <p-tab value="3">نقاط المراقبة</p-tab>
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div class="flex justify-between border-b pb-2">
                  <span class="font-semibold">النوع:</span>
                  <span>{{ getTypeLabel(station()?.type) }}</span>
                </div>
                <div class="flex justify-between border-b pb-2">
                  <span class="font-semibold">مستوى الجهد:</span>
                  <span>{{ station()?.voltageLevel }}</span>
                </div>
                <div class="flex justify-between border-b pb-2">
                  <span class="font-semibold">العنوان:</span>
                  <span>{{ station()?.address || '-' }}</span>
                </div>
              </div>
              <div class="space-y-4">
                <div class="flex justify-between border-b pb-2">
                  <span class="font-semibold">خط العرض:</span>
                  <span>{{ station()?.latitude || '-' }}</span>
                </div>
                <div class="flex justify-between border-b pb-2">
                  <span class="font-semibold">خط الطول:</span>
                  <span>{{ station()?.longitude || '-' }}</span>
                </div>
                <div class="flex justify-between border-b pb-2">
                  <span class="font-semibold">تاريخ الإنشاء:</span>
                  <span>{{ station()?.createdAt | date:'mediumDate' }}</span>
                </div>
              </div>
            </div>
            </p-tabpanel>
            <p-tabpanel value="1">
            <p-table [value]="devices()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>الكود</th>
                  <th>الاسم</th>
                  <th>النوع</th>
                  <th>البروتوكول</th>
                  <th>الحالة</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-device>
                <tr>
                  <td class="font-mono text-blue-600">{{ device.code }}</td>
                  <td>{{ device.name }}</td>
                  <td>{{ device.type }}</td>
                  <td class="font-mono text-xs">{{ device.protocol }}</td>
                  <td>
                    <p-tag [severity]="getStatusSeverity(device.status)" [value]="getStatusLabel(device.status)"></p-tag>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="text-center py-4 text-slate-500">لا توجد أجهزة</td>
                </tr>
              </ng-template>
            </p-table>
            </p-tabpanel>
            <p-tabpanel value="2">
            <p-table [value]="alerts()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>الكود</th>
                  <th>الرسالة</th>
                  <th>الخطورة</th>
                  <th>الحالة</th>
                  <th>الوقت</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-alert>
                <tr>
                  <td class="font-mono text-blue-600">{{ alert.alertCode }}</td>
                  <td>{{ alert.message }}</td>
                  <td>
                    <p-tag [severity]="getSeveritySeverity(alert.severity)" [value]="getSeverityLabel(alert.severity)"></p-tag>
                  </td>
                  <td>
                    <p-tag [severity]="getAlertStatusSeverity(alert.status)" [value]="getAlertStatusLabel(alert.status)"></p-tag>
                  </td>
                  <td>{{ alert.triggeredAt | date:'short' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="text-center py-4 text-slate-500">لا توجد تنبيهات</td>
                </tr>
              </ng-template>
            </p-table>
            </p-tabpanel>
            <p-tabpanel value="3">
            <p-table [value]="monitoringPoints()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>الكود</th>
                  <th>الاسم</th>
                  <th>النوع</th>
                  <th>الوحدة</th>
                  <th>القيمة الحالية</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-point>
                <tr>
                  <td class="font-mono text-blue-600">{{ point.code }}</td>
                  <td>{{ point.name }}</td>
                  <td>{{ point.dataType }}</td>
                  <td>{{ point.unit || '-' }}</td>
                  <td class="font-mono">{{ point.currentValue || '-' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="text-center py-4 text-slate-500">لا توجد نقاط مراقبة</td>
                </tr>
              </ng-template>
            </p-table>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
    </div>
  `,
})
export class StationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  error = signal<string | null>(null);
  station = signal<any>(null);
  devices = signal<any[]>([]);
  alerts = signal<any[]>([]);
  monitoringPoints = signal<any[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStation(id);
    }
  }

  loadStation(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/v1/scada/stations/${id}`).subscribe({
      next: (response) => {
        this.station.set(response);
        this.loadRelatedData(id);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'فشل في تحميل بيانات المحطة');
        this.loading.set(false);
      },
    });
  }

  loadRelatedData(stationId: string) {
    // تحميل الأجهزة
    this.http.get<any>(`${this.apiUrl}/v1/scada/devices?stationId=${stationId}`).subscribe({
      next: (response) => this.devices.set(response?.data || []),
    });

    // تحميل التنبيهات
    this.http.get<any>(`${this.apiUrl}/v1/scada/alerts?stationId=${stationId}`).subscribe({
      next: (response) => this.alerts.set(response?.data || []),
    });

    // تحميل نقاط المراقبة
    this.http.get<any>(`${this.apiUrl}/v1/scada/monitoring-points?stationId=${stationId}`).subscribe({
      next: (response) => this.monitoringPoints.set(response?.data || []),
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      main: 'رئيسية', sub: 'فرعية', distribution: 'توزيعية', solar: 'شمسية',
    };
    return labels[type] || type;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      online: 'success', offline: 'danger', maintenance: 'warn',
    };
    return severities[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      online: 'متصل', offline: 'غير متصل', maintenance: 'صيانة',
    };
    return labels[status] || status;
  }

  getSeveritySeverity(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      critical: 'danger', high: 'warn', medium: 'warn', low: 'info', info: 'secondary',
    };
    return severities[severity] || 'secondary';
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض', info: 'معلومات',
    };
    return labels[severity] || severity;
  }

  getAlertStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      active: 'danger', acknowledged: 'warn', resolved: 'success',
    };
    return severities[status] || 'secondary';
  }

  getAlertStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط', acknowledged: 'معترف به', resolved: 'تم الحل',
    };
    return labels[status] || status;
  }
}
