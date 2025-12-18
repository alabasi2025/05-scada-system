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

interface Device {
  id: string;
  stationId: string;
  code: string;
  name: string;
  nameEn?: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  protocol: string;
  ipAddress?: string;
  port?: number;
  status: string;
  isActive: boolean;
  station?: { name: string; code: string };
  _count?: { monitoringPoints: number };
}

@Component({
  selector: 'app-devices-list',
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
            <i class="pi pi-microchip ml-2"></i>
            قائمة الأجهزة
          </h2>
          <span class="text-slate-500">إجمالي: {{ total() }} جهاز</span>
        </div>
        <div class="flex gap-2">
          <button pButton label="تحديث" icon="pi pi-refresh"
                  class="p-button-outlined" (click)="loadDevices()"></button>
          <button pButton label="إضافة جهاز" icon="pi pi-plus"
                  (click)="openCreateDialog()"></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
        <div>
          <label class="block mb-1 text-sm font-medium">البحث</label>
          <input pInputText [(ngModel)]="searchTerm" placeholder="بحث بالاسم أو الكود..."
                 class="w-full" (input)="onSearch()" />
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium">النوع</label>
          <p-select [options]="deviceTypes" [(ngModel)]="selectedType"
                    optionLabel="label" optionValue="value" placeholder="الكل"
                    class="w-full" (onChange)="loadDevices()"></p-select>
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium">الحالة</label>
          <p-select [options]="statusOptions" [(ngModel)]="selectedStatus"
                    optionLabel="label" optionValue="value" placeholder="الكل"
                    class="w-full" (onChange)="loadDevices()"></p-select>
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium">المحطة</label>
          <p-select [options]="stations" [(ngModel)]="selectedStation"
                    optionLabel="name" optionValue="id" placeholder="الكل"
                    class="w-full" (onChange)="loadDevices()"></p-select>
        </div>
      </div>

      <div *ngIf="loading()" class="flex justify-center items-center h-64">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
      </div>

      <div *ngIf="error()" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>خطأ:</strong> {{ error() }}
        <button (click)="loadDevices()" class="mr-4 text-blue-600 hover:underline">إعادة المحاولة</button>
      </div>

      <p-table *ngIf="!loading() && !error()"
               [value]="devices()"
               [paginator]="true"
               [rows]="10"
               styleClass="p-datatable-gridlines">
        <ng-template pTemplate="header">
          <tr>
            <th>الكود</th>
            <th>الاسم</th>
            <th>المحطة</th>
            <th>النوع</th>
            <th>البروتوكول</th>
            <th>IP</th>
            <th>نقاط المراقبة</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-device>
          <tr>
            <td><span class="font-mono text-blue-600">{{ device.code }}</span></td>
            <td>
              <div>{{ device.name }}</div>
              <div *ngIf="device.nameEn" class="text-xs text-slate-500">{{ device.nameEn }}</div>
            </td>
            <td>{{ device.station?.name || '-' }}</td>
            <td>
              <p-tag [value]="getTypeLabel(device.type)" [severity]="getTypeSeverity(device.type)"></p-tag>
            </td>
            <td><span class="font-mono text-xs">{{ device.protocol }}</span></td>
            <td>
              <span *ngIf="device.ipAddress" class="font-mono text-xs">
                {{ device.ipAddress }}:{{ device.port }}
              </span>
              <span *ngIf="!device.ipAddress" class="text-slate-400">-</span>
            </td>
            <td class="text-center">{{ device._count?.monitoringPoints || 0 }}</td>
            <td>
              <p-tag [severity]="getStatusSeverity(device.status)" [value]="getStatusLabel(device.status)"></p-tag>
            </td>
            <td>
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm"
                      (click)="viewDevice(device)" pTooltip="عرض"></button>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm p-button-warning"
                      (click)="openEditDialog(device)" pTooltip="تعديل"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger"
                      (click)="confirmDelete(device)" pTooltip="حذف"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center py-8 text-slate-500">
              <i class="pi pi-inbox text-4xl mb-2 block"></i>
              لا توجد أجهزة
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Create/Edit Dialog -->
    <p-dialog [(visible)]="dialogVisible" [header]="editMode ? 'تعديل جهاز' : 'إضافة جهاز جديد'"
              [modal]="true" [style]="{width: '600px'}" [draggable]="false">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block mb-1 font-semibold">الكود *</label>
          <input pInputText [(ngModel)]="formData.code" class="w-full" [disabled]="editMode" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">المحطة *</label>
          <p-select [options]="stations" [(ngModel)]="formData.stationId"
                    optionLabel="name" optionValue="id" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">الاسم (عربي) *</label>
          <input pInputText [(ngModel)]="formData.name" class="w-full" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">الاسم (إنجليزي)</label>
          <input pInputText [(ngModel)]="formData.nameEn" class="w-full" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">النوع *</label>
          <p-select [options]="deviceTypes" [(ngModel)]="formData.type"
                    optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">البروتوكول *</label>
          <p-select [options]="protocols" [(ngModel)]="formData.protocol"
                    optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">الشركة المصنعة</label>
          <input pInputText [(ngModel)]="formData.manufacturer" class="w-full" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">الموديل</label>
          <input pInputText [(ngModel)]="formData.model" class="w-full" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">عنوان IP</label>
          <input pInputText [(ngModel)]="formData.ipAddress" class="w-full" placeholder="192.168.1.100" />
        </div>
        <div>
          <label class="block mb-1 font-semibold">المنفذ</label>
          <input pInputText type="number" [(ngModel)]="formData.port" class="w-full" placeholder="502" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="إلغاء" icon="pi pi-times" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton [label]="editMode ? 'تحديث' : 'إضافة'" icon="pi pi-check" [loading]="saving" (click)="saveDevice()"></button>
      </ng-template>
    </p-dialog>

    <!-- View Dialog -->
    <p-dialog [(visible)]="viewDialogVisible" header="تفاصيل الجهاز"
              [modal]="true" [style]="{width: '500px'}" [draggable]="false">
      <div *ngIf="selectedDevice" class="grid gap-3">
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الكود:</span>
          <span class="font-mono">{{ selectedDevice.code }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الاسم:</span>
          <span>{{ selectedDevice.name }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">المحطة:</span>
          <span>{{ selectedDevice.station?.name || '-' }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">النوع:</span>
          <p-tag [value]="getTypeLabel(selectedDevice.type)" [severity]="getTypeSeverity(selectedDevice.type)"></p-tag>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">البروتوكول:</span>
          <span class="font-mono">{{ selectedDevice.protocol }}</span>
        </div>
        <div *ngIf="selectedDevice.ipAddress" class="flex justify-between border-b pb-2">
          <span class="font-semibold">العنوان:</span>
          <span class="font-mono">{{ selectedDevice.ipAddress }}:{{ selectedDevice.port }}</span>
        </div>
        <div *ngIf="selectedDevice.manufacturer" class="flex justify-between border-b pb-2">
          <span class="font-semibold">الشركة المصنعة:</span>
          <span>{{ selectedDevice.manufacturer }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الحالة:</span>
          <p-tag [severity]="getStatusSeverity(selectedDevice.status)" [value]="getStatusLabel(selectedDevice.status)"></p-tag>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">نقاط المراقبة:</span>
          <span>{{ selectedDevice._count?.monitoringPoints || 0 }}</span>
        </div>
      </div>
    </p-dialog>
  `,
})
export class DevicesListComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  error = signal<string | null>(null);
  devices = signal<Device[]>([]);
  total = signal(0);
  stations: any[] = [];

  // Filters
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  selectedStation = '';

  // Dialog
  dialogVisible = false;
  viewDialogVisible = false;
  editMode = false;
  saving = false;
  selectedDevice: Device | null = null;
  formData: any = {};

  deviceTypes = [
    { label: 'محول', value: 'transformer' },
    { label: 'قاطع', value: 'circuit_breaker' },
    { label: 'عداد', value: 'meter' },
    { label: 'مستشعر', value: 'sensor' },
    { label: 'RTU', value: 'rtu' },
    { label: 'PLC', value: 'plc' },
    { label: 'عاكس', value: 'inverter' },
  ];

  protocols = [
    { label: 'Modbus TCP', value: 'modbus_tcp' },
    { label: 'Modbus RTU', value: 'modbus_rtu' },
    { label: 'IEC 61850', value: 'iec61850' },
    { label: 'DNP3', value: 'dnp3' },
    { label: 'OPC UA', value: 'opcua' },
    { label: 'MQTT', value: 'mqtt' },
  ];

  statusOptions = [
    { label: 'متصل', value: 'online' },
    { label: 'غير متصل', value: 'offline' },
    { label: 'صيانة', value: 'maintenance' },
    { label: 'خطأ', value: 'error' },
  ];

  ngOnInit() {
    this.loadStations();
    this.loadDevices();
  }

  loadStations() {
    this.http.get<any>(`${this.apiUrl}/v1/scada/stations`).subscribe({
      next: (response) => {
        this.stations = response?.data || [];
      },
    });
  }

  loadDevices() {
    this.loading.set(true);
    this.error.set(null);

    let url = `${this.apiUrl}/v1/scada/devices?`;
    if (this.searchTerm) url += `search=${this.searchTerm}&`;
    if (this.selectedType) url += `type=${this.selectedType}&`;
    if (this.selectedStatus) url += `status=${this.selectedStatus}&`;
    if (this.selectedStation) url += `stationId=${this.selectedStation}&`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.devices.set(response?.data || []);
        this.total.set(response?.meta?.total || 0);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'فشل في تحميل الأجهزة');
        this.loading.set(false);
      },
    });
  }

  onSearch() {
    clearTimeout((this as any).searchTimeout);
    (this as any).searchTimeout = setTimeout(() => this.loadDevices(), 300);
  }

  openCreateDialog() {
    this.editMode = false;
    this.formData = { protocol: 'modbus_tcp', port: 502 };
    this.dialogVisible = true;
  }

  openEditDialog(device: Device) {
    this.editMode = true;
    this.formData = { ...device };
    this.dialogVisible = true;
  }

  viewDevice(device: Device) {
    this.selectedDevice = device;
    this.viewDialogVisible = true;
  }

  saveDevice() {
    if (!this.formData.code || !this.formData.name || !this.formData.stationId) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى ملء جميع الحقول المطلوبة' });
      return;
    }

    this.saving = true;
    const request = this.editMode
      ? this.http.put(`${this.apiUrl}/v1/scada/devices/${this.formData.id}`, this.formData)
      : this.http.post(`${this.apiUrl}/v1/scada/devices`, this.formData);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: this.editMode ? 'تم تحديث الجهاز بنجاح' : 'تم إضافة الجهاز بنجاح'
        });
        this.dialogVisible = false;
        this.saving = false;
        this.loadDevices();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل في حفظ الجهاز' });
        this.saving = false;
      },
    });
  }

  confirmDelete(device: Device) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف الجهاز "${device.name}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      accept: () => this.deleteDevice(device),
    });
  }

  deleteDevice(device: Device) {
    this.http.delete(`${this.apiUrl}/v1/scada/devices/${device.id}`).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الجهاز بنجاح' });
        this.loadDevices();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل في حذف الجهاز' });
      },
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      transformer: 'محول', circuit_breaker: 'قاطع', meter: 'عداد',
      sensor: 'مستشعر', rtu: 'RTU', plc: 'PLC', inverter: 'عاكس',
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      transformer: 'info', circuit_breaker: 'warn', meter: 'success',
      sensor: 'secondary', rtu: 'contrast', plc: 'contrast', inverter: 'info',
    };
    return severities[type] || 'secondary';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      online: 'success', offline: 'danger', maintenance: 'warn', error: 'danger',
    };
    return severities[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      online: 'متصل', offline: 'غير متصل', maintenance: 'صيانة', error: 'خطأ',
    };
    return labels[status] || status;
  }
}
