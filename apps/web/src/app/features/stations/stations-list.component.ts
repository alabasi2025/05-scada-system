import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Station {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: string;
  voltageLevel: string;
  capacity?: string;
  status: string;
  _count?: {
    devices: number;
    monitoringPoints: number;
    alerts: number;
  };
}

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, TagModule, ButtonModule, InputTextModule, ProgressSpinnerModule],
  template: `
    <div class="scada-card">
      <div class="scada-card-header">
        <h2 class="scada-card-title">
          <i class="pi pi-building ml-2"></i>
          قائمة المحطات
        </h2>
        <span class="text-slate-500">إجمالي: {{ total() }} محطة</span>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center items-center h-64">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>خطأ:</strong> {{ error() }}
        <button (click)="loadStations()" class="mr-4 text-blue-600 hover:underline">إعادة المحاولة</button>
      </div>

      <!-- Table -->
      <div *ngIf="!loading() && !error()">
        <table class="w-full">
          <thead>
            <tr class="border-b bg-gray-50">
              <th class="text-right p-3">الكود</th>
              <th class="text-right p-3">الاسم</th>
              <th class="text-right p-3">النوع</th>
              <th class="text-right p-3">مستوى الجهد</th>
              <th class="text-right p-3">السعة</th>
              <th class="text-right p-3">الأجهزة</th>
              <th class="text-right p-3">الحالة</th>
              <th class="text-right p-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let station of stations()" class="border-b hover:bg-gray-50">
              <td class="p-3">
                <span class="font-mono text-blue-600">{{ station.code }}</span>
              </td>
              <td class="p-3">
                <div class="font-semibold">{{ station.name }}</div>
                <div class="text-sm text-slate-500">{{ station.nameEn }}</div>
              </td>
              <td class="p-3">
                <span [class]="getTypeClass(station.type)">{{ getTypeLabel(station.type) }}</span>
              </td>
              <td class="p-3">{{ station.voltageLevel }}</td>
              <td class="p-3">{{ station.capacity }} MVA</td>
              <td class="p-3">
                <span class="bg-slate-100 px-2 py-1 rounded">{{ station._count?.devices || 0 }} جهاز</span>
              </td>
              <td class="p-3">
                <span [class]="getStatusClass(station.status)">{{ getStatusLabel(station.status) }}</span>
              </td>
              <td class="p-3">
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" 
                        [routerLink]="['/stations', station.id]"
                        pTooltip="عرض التفاصيل"></button>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm p-button-warning"
                        pTooltip="تعديل"></button>
              </td>
            </tr>
            <tr *ngIf="stations().length === 0">
              <td colspan="8" class="text-center py-8 text-slate-500">
                <i class="pi pi-inbox text-4xl mb-2 block"></i>
                لا توجد محطات
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class StationsListComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  error = signal<string | null>(null);
  stations = signal<Station[]>([]);
  total = signal(0);

  ngOnInit() {
    this.loadStations();
  }

  loadStations() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`${this.apiUrl}/v1/scada/stations`).subscribe({
      next: (response) => {
        console.log('Stations list response:', response);
        const stationsData = response?.data || [];
        this.stations.set(stationsData);
        this.total.set(response?.meta?.total || stationsData.length);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading stations:', err);
        this.error.set('فشل في تحميل المحطات');
        this.loading.set(false);
      },
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      main: 'رئيسية',
      substation: 'فرعية',
      distribution: 'توزيعية',
      solar: 'شمسية',
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    const classes: Record<string, string> = {
      main: 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm',
      substation: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm',
      distribution: 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm',
      solar: 'bg-green-100 text-green-800 px-2 py-1 rounded text-sm',
    };
    return classes[type] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm';
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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      online: 'متصل',
      offline: 'غير متصل',
      maintenance: 'صيانة',
      warning: 'تحذير',
    };
    return labels[status] || status;
  }
}
