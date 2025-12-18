import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';

interface Camera {
  id: string;
  cameraCode: string;
  cameraName: string;
  location: string;
  status: string;
  streamUrl: string;
  lastOnlineAt: string;
}

interface AccessLog {
  id: string;
  personName: string;
  accessType: string;
  accessTime: string;
  location: string;
  status: string;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  description: string;
  location: string;
  eventTime: string;
  status: string;
}

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, TagModule, ButtonModule],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">لوحة الأمان والحماية</h2>
      
      <!-- بطاقات الإحصائيات -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ stats().onlineCameras }}</div>
            <div class="text-gray-500">كاميرات متصلة</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ stats().offlineCameras }}</div>
            <div class="text-gray-500">كاميرات غير متصلة</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stats().todayAccessCount }}</div>
            <div class="text-gray-500">عمليات الدخول اليوم</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">{{ stats().activeEvents }}</div>
            <div class="text-gray-500">أحداث نشطة</div>
          </div>
        </p-card>
      </div>

      <!-- الكاميرات -->
      <p-card header="الكاميرات" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          @for (camera of cameras(); track camera.id) {
            <div class="border rounded-lg p-3">
              <div class="aspect-video bg-gray-800 rounded mb-2 flex items-center justify-center">
                <i class="pi pi-video text-4xl text-gray-400"></i>
              </div>
              <div class="font-semibold">{{ camera.cameraName }}</div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-sm text-gray-500">{{ camera.location }}</span>
                <p-tag [severity]="camera.status === 'online' ? 'success' : 'danger'" 
                       [value]="camera.status === 'online' ? 'متصل' : 'غير متصل'"></p-tag>
              </div>
            </div>
          }
        </div>
      </p-card>

      <!-- سجل الدخول والخروج -->
      <p-card header="سجل الدخول والخروج" class="mb-6">
        <p-table [value]="accessLogs()" [paginator]="true" [rows]="5" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>الاسم</th>
              <th>النوع</th>
              <th>الوقت</th>
              <th>الموقع</th>
              <th>الحالة</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-log>
            <tr>
              <td>{{ log.personName }}</td>
              <td>
                <p-tag [severity]="log.accessType === 'entry' ? 'success' : 'info'" 
                       [value]="log.accessType === 'entry' ? 'دخول' : 'خروج'"></p-tag>
              </td>
              <td>{{ log.accessTime | date:'medium' }}</td>
              <td>{{ log.location }}</td>
              <td>
                <p-tag [severity]="log.status === 'authorized' ? 'success' : 'danger'" 
                       [value]="log.status === 'authorized' ? 'مصرح' : 'غير مصرح'"></p-tag>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- أحداث الأمان -->
      <p-card header="أحداث الأمان">
        <p-table [value]="events()" [paginator]="true" [rows]="5" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>النوع</th>
              <th>الخطورة</th>
              <th>الوصف</th>
              <th>الموقع</th>
              <th>الوقت</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-event>
            <tr>
              <td>{{ getEventTypeLabel(event.eventType) }}</td>
              <td>
                <p-tag [severity]="getSeverityTag(event.severity)" [value]="getSeverityLabel(event.severity)"></p-tag>
              </td>
              <td>{{ event.description }}</td>
              <td>{{ event.location }}</td>
              <td>{{ event.eventTime | date:'medium' }}</td>
              <td>
                <p-tag [severity]="event.status === 'resolved' ? 'success' : 'warn'" 
                       [value]="event.status === 'resolved' ? 'تم الحل' : 'نشط'"></p-tag>
              </td>
              <td>
                @if (event.status !== 'resolved') {
                  <p-button icon="pi pi-check" severity="success" size="small" 
                            (onClick)="resolveEvent(event.id)" pTooltip="حل الحدث"></p-button>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `
})
export class SecurityDashboardComponent implements OnInit {
  cameras = signal<Camera[]>([]);
  accessLogs = signal<AccessLog[]>([]);
  events = signal<SecurityEvent[]>([]);
  stats = signal<any>({});

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/security/dashboard`).subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading stats', err)
    });

    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/security/cameras`).subscribe({
      next: (data) => this.cameras.set(data.data || data || []),
      error: (err) => console.error('Error loading cameras', err)
    });

    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/security/access-logs`).subscribe({
      next: (data) => this.accessLogs.set(data.data || data || []),
      error: (err) => console.error('Error loading access logs', err)
    });

    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/security/events`).subscribe({
      next: (data) => this.events.set(data.data || data || []),
      error: (err) => console.error('Error loading events', err)
    });
  }

  getEventTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'intrusion': 'اقتحام',
      'motion': 'حركة',
      'fire': 'حريق',
      'access_denied': 'رفض دخول',
      'equipment_tamper': 'عبث بالمعدات'
    };
    return types[type] || type;
  }

  getSeverityTag(severity: string): 'success' | 'info' | 'warn' | 'danger' {
    const tags: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      'low': 'info',
      'medium': 'warn',
      'high': 'danger',
      'critical': 'danger'
    };
    return tags[severity] || 'info';
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      'low': 'منخفض',
      'medium': 'متوسط',
      'high': 'عالي',
      'critical': 'حرج'
    };
    return labels[severity] || severity;
  }

  resolveEvent(eventId: string) {
    this.http.put(`${environment.apiUrl}/api/v1/scada/security/events/${eventId}`, { status: 'resolved' }).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Error resolving event', err)
    });
  }
}
