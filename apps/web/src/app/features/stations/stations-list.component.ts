import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
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
  address?: string;
  latitude?: number;
  longitude?: number;
  _count?: {
    devices: number;
    monitoringPoints: number;
    alerts: number;
  };
}

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, TableModule, TagModule, ButtonModule, 
    InputTextModule, ProgressSpinnerModule, DialogModule, Select, 
    ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="scada-card">
      <div class="scada-card-header flex justify-between items-center">
        <div>
          <h2 class="scada-card-title">
            <i class="pi pi-building ml-2"></i>
            قائمة المحطات
          </h2>
          <span class="text-slate-500">إجمالي: {{ total() }} محطة</span>
        </div>
        <button pButton label="إضافة محطة" icon="pi pi-plus" 
                class="p-button-success" (click)="openCreateDialog()"></button>
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
                        (click)="openEditDialog(station)"
                        pTooltip="تعديل"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger"
                        (click)="confirmDelete(station)"
                        pTooltip="حذف"></button>
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

    <!-- Create/Edit Dialog -->
    <p-dialog [(visible)]="dialogVisible" [header]="editMode ? 'تعديل محطة' : 'إضافة محطة جديدة'" 
              [modal]="true" [style]="{width: '500px'}" [draggable]="false">
      <div class="grid gap-4">
        <div>
          <label class="block mb-1 font-semibold">الكود *</label>
          <input pInputText [(ngModel)]="formData.code" class="w-full" [disabled]="editMode" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">الاسم بالعربية *</label>
          <input pInputText [(ngModel)]="formData.name" class="w-full" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">الاسم بالإنجليزية</label>
          <input pInputText [(ngModel)]="formData.nameEn" class="w-full" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">النوع *</label>
          <p-select [options]="stationTypes" [(ngModel)]="formData.type" 
                      optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">مستوى الجهد</label>
          <p-select [options]="voltageLevels" [(ngModel)]="formData.voltageLevel" 
                      optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">السعة (MVA)</label>
          <input pInputText type="number" [(ngModel)]="formData.capacity" class="w-full" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">العنوان</label>
          <input pInputText [(ngModel)]="formData.address" class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="إلغاء" icon="pi pi-times" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton [label]="editMode ? 'تحديث' : 'حفظ'" icon="pi pi-check" 
                [loading]="saving" (click)="saveStation()"></button>
      </ng-template>
    </p-dialog>
  `,
})
export class StationsListComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  error = signal<string | null>(null);
  stations = signal<Station[]>([]);
  total = signal(0);

  dialogVisible = false;
  editMode = false;
  saving = false;
  selectedStation: Station | null = null;

  formData = {
    code: '',
    name: '',
    nameEn: '',
    type: 'main',
    voltageLevel: 'HV',
    capacity: 0,
    address: ''
  };

  stationTypes = [
    { label: 'رئيسية', value: 'main' },
    { label: 'فرعية', value: 'substation' },
    { label: 'توزيعية', value: 'distribution' },
    { label: 'شمسية', value: 'solar' }
  ];

  voltageLevels = [
    { label: 'جهد عالي (HV)', value: 'HV' },
    { label: 'جهد متوسط (MV)', value: 'MV' },
    { label: 'جهد منخفض (LV)', value: 'LV' }
  ];

  ngOnInit() {
    this.loadStations();
  }

  loadStations() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`${this.apiUrl}/v1/scada/stations`).subscribe({
      next: (response) => {
        const stationsData = response?.data || [];
        this.stations.set(stationsData);
        this.total.set(response?.meta?.total || stationsData.length);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading stations:', err);
        this.error.set(err.error?.message || 'فشل في تحميل المحطات');
        this.loading.set(false);
      },
    });
  }

  openCreateDialog() {
    this.editMode = false;
    this.selectedStation = null;
    this.formData = {
      code: '',
      name: '',
      nameEn: '',
      type: 'main',
      voltageLevel: 'HV',
      capacity: 0,
      address: ''
    };
    this.dialogVisible = true;
  }

  openEditDialog(station: Station) {
    this.editMode = true;
    this.selectedStation = station;
    this.formData = {
      code: station.code,
      name: station.name,
      nameEn: station.nameEn || '',
      type: station.type,
      voltageLevel: station.voltageLevel,
      capacity: parseFloat(station.capacity || '0'),
      address: station.address || ''
    };
    this.dialogVisible = true;
  }

  saveStation() {
    if (!this.formData.code || !this.formData.name || !this.formData.type) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    this.saving = true;
    const url = this.editMode 
      ? `${this.apiUrl}/v1/scada/stations/${this.selectedStation?.id}`
      : `${this.apiUrl}/v1/scada/stations`;
    
    const request = this.editMode 
      ? this.http.put(url, this.formData)
      : this.http.post(url, this.formData);

    request.subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'نجاح', 
          detail: this.editMode ? 'تم تحديث المحطة بنجاح' : 'تم إنشاء المحطة بنجاح' 
        });
        this.dialogVisible = false;
        this.saving = false;
        this.loadStations();
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'خطأ', 
          detail: err.error?.message || 'فشل في حفظ المحطة' 
        });
        this.saving = false;
      }
    });
  }

  confirmDelete(station: Station) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف المحطة "${station.name}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      accept: () => this.deleteStation(station)
    });
  }

  deleteStation(station: Station) {
    this.http.delete(`${this.apiUrl}/v1/scada/stations/${station.id}`).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المحطة بنجاح' });
        this.loadStations();
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'خطأ', 
          detail: err.error?.message || 'فشل في حذف المحطة' 
        });
      }
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
