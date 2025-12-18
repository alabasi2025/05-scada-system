import { Component, OnInit, inject, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { environment } from '../../../environments/environment';

interface Station {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  latitude?: number;
  longitude?: number;
  _count?: { devices: number; alerts: number };
}

@Component({
  selector: 'app-network-map',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TagModule, DialogModule, ProgressSpinnerModule],
  template: `
    <div class="scada-card">
      <div class="scada-card-header flex justify-between items-center">
        <div>
          <h2 class="scada-card-title">
            <i class="pi pi-map ml-2"></i>
            خريطة الشبكة
          </h2>
          <span class="text-slate-500">عرض المحطات على الخريطة</span>
        </div>
        <div class="flex gap-2">
          <button pButton label="تحديث" icon="pi pi-refresh" class="p-button-outlined" (click)="loadStations()"></button>
        </div>
      </div>

      <div *ngIf="loading()" class="flex justify-center items-center h-96">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
      </div>

      <!-- Map Container -->
      <div *ngIf="!loading()" class="relative">
        <!-- SVG Map -->
        <div class="bg-slate-100 rounded-lg p-4 min-h-[500px] relative overflow-hidden">
          <!-- Grid Background -->
          <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <!-- Stations -->
          <div class="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <div *ngFor="let station of stations()" 
                 class="station-card cursor-pointer transition-all hover:scale-105"
                 (click)="selectStation(station)">
              <div class="bg-white rounded-lg shadow-md p-4 border-2"
                   [ngClass]="{
                     'border-green-500': station.status === 'online',
                     'border-red-500': station.status === 'offline',
                     'border-yellow-500': station.status === 'maintenance'
                   }">
                <!-- Station Icon -->
                <div class="flex items-center justify-center mb-3">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center"
                       [ngClass]="{
                         'bg-green-100': station.status === 'online',
                         'bg-red-100': station.status === 'offline',
                         'bg-yellow-100': station.status === 'maintenance'
                       }">
                    <i class="pi text-2xl"
                       [ngClass]="{
                         'pi-building text-green-600': station.status === 'online',
                         'pi-building text-red-600': station.status === 'offline',
                         'pi-wrench text-yellow-600': station.status === 'maintenance'
                       }"></i>
                  </div>
                </div>
                
                <!-- Station Info -->
                <div class="text-center">
                  <h3 class="font-bold text-slate-800">{{ station.name }}</h3>
                  <p class="text-xs text-slate-500 font-mono">{{ station.code }}</p>
                  <p-tag [severity]="getTypeSeverity(station.type)" [value]="getTypeLabel(station.type)" class="mt-2"></p-tag>
                </div>

                <!-- Stats -->
                <div class="flex justify-around mt-3 pt-3 border-t">
                  <div class="text-center">
                    <div class="text-lg font-bold text-blue-600">{{ station._count?.devices || 0 }}</div>
                    <div class="text-xs text-slate-500">أجهزة</div>
                  </div>
                  <div class="text-center">
                    <div class="text-lg font-bold" [ngClass]="{'text-red-600': (station._count?.alerts || 0) > 0, 'text-green-600': (station._count?.alerts || 0) === 0}">
                      {{ station._count?.alerts || 0 }}
                    </div>
                    <div class="text-xs text-slate-500">تنبيهات</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="absolute bottom-4 left-4 bg-white rounded-lg shadow p-3">
            <h4 class="font-semibold mb-2 text-sm">دليل الألوان</h4>
            <div class="space-y-1 text-xs">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span>متصل</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span>غير متصل</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>صيانة</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stations().length }}</div>
            <div class="text-slate-600">إجمالي المحطات</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-green-600">{{ getOnlineCount() }}</div>
            <div class="text-slate-600">متصلة</div>
          </div>
          <div class="bg-red-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-red-600">{{ getOfflineCount() }}</div>
            <div class="text-slate-600">غير متصلة</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-yellow-600">{{ getMaintenanceCount() }}</div>
            <div class="text-slate-600">صيانة</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Station Detail Dialog -->
    <p-dialog [(visible)]="dialogVisible" [header]="selectedStation?.name" 
              [modal]="true" [style]="{width: '450px'}" [draggable]="false">
      <div *ngIf="selectedStation" class="space-y-4">
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الكود:</span>
          <span class="font-mono">{{ selectedStation.code }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">النوع:</span>
          <p-tag [severity]="getTypeSeverity(selectedStation.type)" [value]="getTypeLabel(selectedStation.type)"></p-tag>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الحالة:</span>
          <p-tag [severity]="getStatusSeverity(selectedStation.status)" [value]="getStatusLabel(selectedStation.status)"></p-tag>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الأجهزة:</span>
          <span>{{ selectedStation._count?.devices || 0 }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">التنبيهات النشطة:</span>
          <span [ngClass]="{'text-red-600 font-bold': (selectedStation._count?.alerts || 0) > 0}">
            {{ selectedStation._count?.alerts || 0 }}
          </span>
        </div>
        <div *ngIf="selectedStation.latitude" class="flex justify-between border-b pb-2">
          <span class="font-semibold">الإحداثيات:</span>
          <span class="font-mono text-sm">{{ selectedStation.latitude }}, {{ selectedStation.longitude }}</span>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <a [routerLink]="['/stations', selectedStation?.id]" pButton label="عرض التفاصيل" icon="pi pi-eye"></a>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .station-card:hover {
      transform: translateY(-2px);
    }
  `]
})
export class NetworkMapComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  stations = signal<Station[]>([]);
  selectedStation: Station | null = null;
  dialogVisible = false;

  ngOnInit() {
    this.loadStations();
  }

  loadStations() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/v1/scada/stations`).subscribe({
      next: (response) => {
        this.stations.set(response?.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  selectStation(station: Station) {
    this.selectedStation = station;
    this.dialogVisible = true;
  }

  getOnlineCount(): number {
    return this.stations().filter(s => s.status === 'online').length;
  }

  getOfflineCount(): number {
    return this.stations().filter(s => s.status === 'offline').length;
  }

  getMaintenanceCount(): number {
    return this.stations().filter(s => s.status === 'maintenance').length;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      main: 'رئيسية', sub: 'فرعية', distribution: 'توزيعية', solar: 'شمسية',
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      main: 'info', sub: 'success', distribution: 'warn', solar: 'contrast',
    };
    return severities[type] || 'secondary';
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
}
