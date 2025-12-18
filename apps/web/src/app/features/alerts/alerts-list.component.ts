import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Alert } from '../../core/models';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ButtonModule, ProgressSpinnerModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    
    <div class="scada-card">
      <div class="scada-card-header">
        <h2 class="scada-card-title">
          <i class="pi pi-bell ml-2"></i>
          التنبيهات
        </h2>
        <span class="text-slate-500">إجمالي: {{ total() }} تنبيه</span>
      </div>

      <div *ngIf="loading()" class="flex justify-center items-center h-64">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
      </div>

      <p-table *ngIf="!loading()"
               [value]="alerts()" 
               [paginator]="true" 
               [rows]="10"
               styleClass="p-datatable-gridlines">
        <ng-template pTemplate="header">
          <tr>
            <th>الرقم</th>
            <th>الرسالة</th>
            <th>الخطورة</th>
            <th>الحالة</th>
            <th>الوقت</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-alert>
          <tr>
            <td>{{ alert.alertNumber }}</td>
            <td>{{ alert.message }}</td>
            <td>
              <p-tag [severity]="getSeverityColor(alert.severity)" [value]="getSeverityLabel(alert.severity)"></p-tag>
            </td>
            <td>
              <p-tag [severity]="getStatusSeverity(alert.status)" [value]="getStatusLabel(alert.status)"></p-tag>
            </td>
            <td>{{ alert.occurredAt | date:'short' }}</td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" class="text-center py-8 text-slate-500">
              لا توجد تنبيهات
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class AlertsListComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  alerts = signal<Alert[]>([]);
  total = signal(0);

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/v1/scada/alerts`).subscribe({
      next: (response) => {
        console.log('Alerts response:', response);
        const alertsData = response?.data || [];
        this.alerts.set(alertsData);
        this.total.set(response?.meta?.total || alertsData.length);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading alerts:', err);
        this.loading.set(false);
      },
    });
  }

  getSeverityColor(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const colors: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      critical: 'danger', high: 'warn', medium: 'warn', low: 'info', info: 'secondary',
    };
    return colors[severity] || 'secondary';
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض', info: 'معلومات',
    };
    return labels[severity] || severity;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      active: 'danger', acknowledged: 'warn', cleared: 'success',
    };
    return severities[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط', acknowledged: 'معترف به', cleared: 'تم المسح',
    };
    return labels[status] || status;
  }
}
