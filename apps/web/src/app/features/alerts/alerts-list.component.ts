import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { Textarea } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Alert {
  id: string;
  alertCode: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  station?: { name: string };
}

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, TagModule, ButtonModule, 
    ProgressSpinnerModule, ToastModule, DialogModule, Textarea, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="scada-card">
      <div class="scada-card-header flex justify-between items-center">
        <div>
          <h2 class="scada-card-title">
            <i class="pi pi-bell ml-2"></i>
            التنبيهات
          </h2>
          <span class="text-slate-500">إجمالي: {{ total() }} تنبيه</span>
        </div>
        <div class="flex gap-2">
          <button pButton label="تحديث" icon="pi pi-refresh" 
                  class="p-button-outlined" (click)="loadAlerts()"></button>
        </div>
      </div>

      <div *ngIf="loading()" class="flex justify-center items-center h-64">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
      </div>

      <div *ngIf="error()" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>خطأ:</strong> {{ error() }}
        <button (click)="loadAlerts()" class="mr-4 text-blue-600 hover:underline">إعادة المحاولة</button>
      </div>

      <p-table *ngIf="!loading() && !error()"
               [value]="alerts()" 
               [paginator]="true" 
               [rows]="10"
               styleClass="p-datatable-gridlines">
        <ng-template pTemplate="header">
          <tr>
            <th>الكود</th>
            <th>العنوان</th>
            <th>الرسالة</th>
            <th>المحطة</th>
            <th>الخطورة</th>
            <th>الحالة</th>
            <th>الوقت</th>
            <th>الإجراءات</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-alert>
          <tr>
            <td><span class="font-mono text-blue-600">{{ alert.alertCode }}</span></td>
            <td>{{ alert.title }}</td>
            <td class="max-w-xs truncate">{{ alert.message }}</td>
            <td>{{ alert.station?.name || '-' }}</td>
            <td>
              <p-tag [severity]="getSeverityColor(alert.severity)" [value]="getSeverityLabel(alert.severity)"></p-tag>
            </td>
            <td>
              <p-tag [severity]="getStatusSeverity(alert.status)" [value]="getStatusLabel(alert.status)"></p-tag>
            </td>
            <td>{{ alert.triggeredAt | date:'short' }}</td>
            <td>
              <button *ngIf="alert.status === 'active'" 
                      pButton icon="pi pi-check" class="p-button-text p-button-sm p-button-warning"
                      (click)="acknowledgeAlert(alert)"
                      pTooltip="الاعتراف بالتنبيه"></button>
              <button *ngIf="alert.status === 'active' || alert.status === 'acknowledged'" 
                      pButton icon="pi pi-check-circle" class="p-button-text p-button-sm p-button-success"
                      (click)="openResolveDialog(alert)"
                      pTooltip="حل التنبيه"></button>
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm"
                      (click)="viewAlert(alert)"
                      pTooltip="عرض التفاصيل"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" class="text-center py-8 text-slate-500">
              <i class="pi pi-check-circle text-4xl mb-2 block text-green-500"></i>
              لا توجد تنبيهات
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- View Alert Dialog -->
    <p-dialog [(visible)]="viewDialogVisible" header="تفاصيل التنبيه" 
              [modal]="true" [style]="{width: '500px'}" [draggable]="false">
      <div *ngIf="selectedAlert" class="grid gap-4">
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الكود:</span>
          <span class="font-mono">{{ selectedAlert.alertCode }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">العنوان:</span>
          <span>{{ selectedAlert.title }}</span>
        </div>
        <div class="border-b pb-2">
          <span class="font-semibold block mb-1">الرسالة:</span>
          <p class="text-slate-600">{{ selectedAlert.message }}</p>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الخطورة:</span>
          <p-tag [severity]="getSeverityColor(selectedAlert.severity)" [value]="getSeverityLabel(selectedAlert.severity)"></p-tag>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الحالة:</span>
          <p-tag [severity]="getStatusSeverity(selectedAlert.status)" [value]="getStatusLabel(selectedAlert.status)"></p-tag>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">وقت الحدوث:</span>
          <span>{{ selectedAlert.triggeredAt | date:'medium' }}</span>
        </div>
        <div *ngIf="selectedAlert.acknowledgedAt" class="flex justify-between border-b pb-2">
          <span class="font-semibold">وقت الاعتراف:</span>
          <span>{{ selectedAlert.acknowledgedAt | date:'medium' }}</span>
        </div>
        <div *ngIf="selectedAlert.resolvedAt" class="flex justify-between border-b pb-2">
          <span class="font-semibold">وقت الحل:</span>
          <span>{{ selectedAlert.resolvedAt | date:'medium' }}</span>
        </div>
        <div *ngIf="selectedAlert.resolutionNotes" class="border-b pb-2">
          <span class="font-semibold block mb-1">ملاحظات الحل:</span>
          <p class="text-slate-600">{{ selectedAlert.resolutionNotes }}</p>
        </div>
      </div>
    </p-dialog>

    <!-- Resolve Alert Dialog -->
    <p-dialog [(visible)]="resolveDialogVisible" header="حل التنبيه" 
              [modal]="true" [style]="{width: '400px'}" [draggable]="false">
      <div class="grid gap-4">
        <div>
          <label class="block mb-1 font-semibold">ملاحظات الحل</label>
          <textarea pTextarea [(ngModel)]="resolutionNotes" rows="4" class="w-full"
                    placeholder="أدخل ملاحظات حول كيفية حل هذا التنبيه..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="إلغاء" icon="pi pi-times" class="p-button-text" (click)="resolveDialogVisible = false"></button>
        <button pButton label="حل التنبيه" icon="pi pi-check" [loading]="saving" (click)="resolveAlert()"></button>
      </ng-template>
    </p-dialog>
  `,
})
export class AlertsListComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  error = signal<string | null>(null);
  alerts = signal<Alert[]>([]);
  total = signal(0);

  viewDialogVisible = false;
  resolveDialogVisible = false;
  selectedAlert: Alert | null = null;
  resolutionNotes = '';
  saving = false;

  // Dummy user ID for demo - in real app, get from auth service
  currentUserId = '00000000-0000-0000-0000-000000000001';

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.loading.set(true);
    this.error.set(null);
    
    this.http.get<any>(`${this.apiUrl}/v1/scada/alerts`).subscribe({
      next: (response) => {
        const alertsData = response?.data || [];
        this.alerts.set(alertsData);
        this.total.set(response?.meta?.total || alertsData.length);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading alerts:', err);
        this.error.set(err.error?.message || 'فشل في تحميل التنبيهات');
        this.loading.set(false);
      },
    });
  }

  viewAlert(alert: Alert) {
    this.selectedAlert = alert;
    this.viewDialogVisible = true;
  }

  acknowledgeAlert(alert: Alert) {
    this.http.put(`${this.apiUrl}/v1/scada/alerts/${alert.id}/acknowledge`, {
      userId: this.currentUserId
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم الاعتراف بالتنبيه' });
        this.loadAlerts();
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'خطأ', 
          detail: err.error?.message || 'فشل في الاعتراف بالتنبيه' 
        });
      }
    });
  }

  openResolveDialog(alert: Alert) {
    this.selectedAlert = alert;
    this.resolutionNotes = '';
    this.resolveDialogVisible = true;
  }

  resolveAlert() {
    if (!this.selectedAlert) return;
    
    this.saving = true;
    this.http.put(`${this.apiUrl}/v1/scada/alerts/${this.selectedAlert.id}/resolve`, {
      userId: this.currentUserId,
      notes: this.resolutionNotes
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حل التنبيه بنجاح' });
        this.resolveDialogVisible = false;
        this.saving = false;
        this.loadAlerts();
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'خطأ', 
          detail: err.error?.message || 'فشل في حل التنبيه' 
        });
        this.saving = false;
      }
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
      active: 'danger', acknowledged: 'warn', resolved: 'success', cleared: 'success',
    };
    return severities[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط', acknowledged: 'معترف به', resolved: 'تم الحل', cleared: 'تم المسح',
    };
    return labels[status] || status;
  }
}
