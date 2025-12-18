import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Command {
  id: string;
  commandCode: string;
  commandType: string;
  targetType: string;
  targetId: string;
  parameters?: any;
  status: string;
  priority: string;
  issuedAt: string;
  executedAt?: string;
  completedAt?: string;
  result?: string;
  errorMessage?: string;
  station?: { name: string };
  device?: { name: string };
}

@Component({
  selector: 'app-commands-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, TagModule, ButtonModule,
    ProgressSpinnerModule, DialogModule, Select, ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="scada-card">
      <div class="scada-card-header flex justify-between items-center">
        <div>
          <h2 class="scada-card-title">
            <i class="pi pi-bolt ml-2"></i>
            سجل الأوامر
          </h2>
          <span class="text-slate-500">إجمالي: {{ total() }} أمر</span>
        </div>
        <div class="flex gap-2">
          <button pButton label="تحديث" icon="pi pi-refresh"
                  class="p-button-outlined" (click)="loadCommands()"></button>
          <button pButton label="إرسال أمر جديد" icon="pi pi-send"
                  (click)="openSendDialog()"></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
        <div>
          <label class="block mb-1 text-sm font-medium">نوع الأمر</label>
          <p-select [options]="commandTypes" [(ngModel)]="selectedType"
                    optionLabel="label" optionValue="value" placeholder="الكل"
                    class="w-full" (onChange)="loadCommands()"></p-select>
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium">الحالة</label>
          <p-select [options]="statusOptions" [(ngModel)]="selectedStatus"
                    optionLabel="label" optionValue="value" placeholder="الكل"
                    class="w-full" (onChange)="loadCommands()"></p-select>
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium">الأولوية</label>
          <p-select [options]="priorityOptions" [(ngModel)]="selectedPriority"
                    optionLabel="label" optionValue="value" placeholder="الكل"
                    class="w-full" (onChange)="loadCommands()"></p-select>
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium">المحطة</label>
          <p-select [options]="stations" [(ngModel)]="selectedStation"
                    optionLabel="name" optionValue="id" placeholder="الكل"
                    class="w-full" (onChange)="loadCommands()"></p-select>
        </div>
      </div>

      <div *ngIf="loading()" class="flex justify-center items-center h-64">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
      </div>

      <div *ngIf="error()" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>خطأ:</strong> {{ error() }}
        <button (click)="loadCommands()" class="mr-4 text-blue-600 hover:underline">إعادة المحاولة</button>
      </div>

      <p-table *ngIf="!loading() && !error()"
               [value]="commands()"
               [paginator]="true"
               [rows]="10"
               styleClass="p-datatable-gridlines">
        <ng-template pTemplate="header">
          <tr>
            <th>الكود</th>
            <th>النوع</th>
            <th>الهدف</th>
            <th>الأولوية</th>
            <th>الحالة</th>
            <th>وقت الإصدار</th>
            <th>وقت التنفيذ</th>
            <th>النتيجة</th>
            <th>الإجراءات</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-cmd>
          <tr>
            <td><span class="font-mono text-blue-600">{{ cmd.commandCode }}</span></td>
            <td>
              <p-tag [value]="getTypeLabel(cmd.commandType)" [severity]="getTypeSeverity(cmd.commandType)"></p-tag>
            </td>
            <td>
              <div>{{ cmd.station?.name || cmd.device?.name || '-' }}</div>
              <div class="text-xs text-slate-500">{{ cmd.targetType }}</div>
            </td>
            <td>
              <p-tag [value]="getPriorityLabel(cmd.priority)" [severity]="getPrioritySeverity(cmd.priority)"></p-tag>
            </td>
            <td>
              <p-tag [value]="getStatusLabel(cmd.status)" [severity]="getStatusSeverity(cmd.status)"></p-tag>
            </td>
            <td>{{ cmd.issuedAt | date:'short' }}</td>
            <td>{{ cmd.executedAt ? (cmd.executedAt | date:'short') : '-' }}</td>
            <td>
              <span *ngIf="cmd.result" class="text-green-600">{{ cmd.result }}</span>
              <span *ngIf="cmd.errorMessage" class="text-red-600">{{ cmd.errorMessage }}</span>
              <span *ngIf="!cmd.result && !cmd.errorMessage" class="text-slate-400">-</span>
            </td>
            <td>
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm"
                      (click)="viewCommand(cmd)" pTooltip="عرض"></button>
              <button *ngIf="cmd.status === 'pending'" pButton icon="pi pi-times"
                      class="p-button-text p-button-sm p-button-danger"
                      (click)="cancelCommand(cmd)" pTooltip="إلغاء"></button>
              <button *ngIf="cmd.status === 'failed'" pButton icon="pi pi-replay"
                      class="p-button-text p-button-sm p-button-warning"
                      (click)="retryCommand(cmd)" pTooltip="إعادة المحاولة"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center py-8 text-slate-500">
              <i class="pi pi-inbox text-4xl mb-2 block"></i>
              لا توجد أوامر
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Send Command Dialog -->
    <p-dialog [(visible)]="sendDialogVisible" header="إرسال أمر جديد"
              [modal]="true" [style]="{width: '500px'}" [draggable]="false">
      <div class="grid gap-4">
        <div>
          <label class="block mb-1 font-semibold">نوع الأمر *</label>
          <p-select [options]="commandTypes" [(ngModel)]="newCommand.commandType"
                    optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">نوع الهدف *</label>
          <p-select [options]="targetTypes" [(ngModel)]="newCommand.targetType"
                    optionLabel="label" optionValue="value" class="w-full"
                    (onChange)="onTargetTypeChange()"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">الهدف *</label>
          <p-select [options]="targets" [(ngModel)]="newCommand.targetId"
                    optionLabel="name" optionValue="id" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">الأولوية</label>
          <p-select [options]="priorityOptions" [(ngModel)]="newCommand.priority"
                    optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">ملاحظات</label>
          <input pInputText [(ngModel)]="newCommand.notes" class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="إلغاء" icon="pi pi-times" class="p-button-text" (click)="sendDialogVisible = false"></button>
        <button pButton label="إرسال" icon="pi pi-send" [loading]="sending" (click)="sendCommand()"></button>
      </ng-template>
    </p-dialog>

    <!-- View Command Dialog -->
    <p-dialog [(visible)]="viewDialogVisible" header="تفاصيل الأمر"
              [modal]="true" [style]="{width: '500px'}" [draggable]="false">
      <div *ngIf="selectedCommand" class="grid gap-3">
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الكود:</span>
          <span class="font-mono">{{ selectedCommand.commandCode }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">النوع:</span>
          <p-tag [value]="getTypeLabel(selectedCommand.commandType)" [severity]="getTypeSeverity(selectedCommand.commandType)"></p-tag>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الهدف:</span>
          <span>{{ selectedCommand.station?.name || selectedCommand.device?.name }}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الأولوية:</span>
          <p-tag [value]="getPriorityLabel(selectedCommand.priority)" [severity]="getPrioritySeverity(selectedCommand.priority)"></p-tag>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">الحالة:</span>
          <p-tag [value]="getStatusLabel(selectedCommand.status)" [severity]="getStatusSeverity(selectedCommand.status)"></p-tag>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span class="font-semibold">وقت الإصدار:</span>
          <span>{{ selectedCommand.issuedAt | date:'medium' }}</span>
        </div>
        <div *ngIf="selectedCommand.executedAt" class="flex justify-between border-b pb-2">
          <span class="font-semibold">وقت التنفيذ:</span>
          <span>{{ selectedCommand.executedAt | date:'medium' }}</span>
        </div>
        <div *ngIf="selectedCommand.completedAt" class="flex justify-between border-b pb-2">
          <span class="font-semibold">وقت الإكمال:</span>
          <span>{{ selectedCommand.completedAt | date:'medium' }}</span>
        </div>
        <div *ngIf="selectedCommand.result" class="border-b pb-2">
          <span class="font-semibold block mb-1">النتيجة:</span>
          <p class="text-green-600">{{ selectedCommand.result }}</p>
        </div>
        <div *ngIf="selectedCommand.errorMessage" class="border-b pb-2">
          <span class="font-semibold block mb-1">رسالة الخطأ:</span>
          <p class="text-red-600">{{ selectedCommand.errorMessage }}</p>
        </div>
      </div>
    </p-dialog>
  `,
})
export class CommandsListComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  loading = signal(true);
  error = signal<string | null>(null);
  commands = signal<Command[]>([]);
  total = signal(0);
  stations: any[] = [];
  devices: any[] = [];
  targets: any[] = [];

  // Filters
  selectedType = '';
  selectedStatus = '';
  selectedPriority = '';
  selectedStation = '';

  // Dialogs
  sendDialogVisible = false;
  viewDialogVisible = false;
  sending = false;
  selectedCommand: Command | null = null;
  newCommand: any = { priority: 'normal' };

  commandTypes = [
    { label: 'فصل', value: 'disconnect' },
    { label: 'وصل', value: 'connect' },
    { label: 'إعادة تشغيل', value: 'restart' },
    { label: 'قراءة', value: 'read' },
    { label: 'كتابة', value: 'write' },
    { label: 'معايرة', value: 'calibrate' },
    { label: 'اختبار', value: 'test' },
  ];

  targetTypes = [
    { label: 'محطة', value: 'station' },
    { label: 'جهاز', value: 'device' },
  ];

  statusOptions = [
    { label: 'قيد الانتظار', value: 'pending' },
    { label: 'قيد التنفيذ', value: 'executing' },
    { label: 'مكتمل', value: 'completed' },
    { label: 'فشل', value: 'failed' },
    { label: 'ملغي', value: 'cancelled' },
  ];

  priorityOptions = [
    { label: 'منخفضة', value: 'low' },
    { label: 'عادية', value: 'normal' },
    { label: 'عالية', value: 'high' },
    { label: 'حرجة', value: 'critical' },
  ];

  ngOnInit() {
    this.loadStations();
    this.loadDevices();
    this.loadCommands();
  }

  loadStations() {
    this.http.get<any>(`${this.apiUrl}/v1/scada/stations`).subscribe({
      next: (response) => { this.stations = response?.data || []; },
    });
  }

  loadDevices() {
    this.http.get<any>(`${this.apiUrl}/v1/scada/devices`).subscribe({
      next: (response) => { this.devices = response?.data || []; },
    });
  }

  loadCommands() {
    this.loading.set(true);
    this.error.set(null);

    let url = `${this.apiUrl}/v1/scada/commands?`;
    if (this.selectedType) url += `type=${this.selectedType}&`;
    if (this.selectedStatus) url += `status=${this.selectedStatus}&`;
    if (this.selectedPriority) url += `priority=${this.selectedPriority}&`;
    if (this.selectedStation) url += `stationId=${this.selectedStation}&`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.commands.set(response?.data || []);
        this.total.set(response?.meta?.total || 0);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'فشل في تحميل الأوامر');
        this.loading.set(false);
      },
    });
  }

  openSendDialog() {
    this.newCommand = { priority: 'normal', targetType: 'station' };
    this.targets = this.stations;
    this.sendDialogVisible = true;
  }

  onTargetTypeChange() {
    this.targets = this.newCommand.targetType === 'station' ? this.stations : this.devices;
    this.newCommand.targetId = '';
  }

  viewCommand(cmd: Command) {
    this.selectedCommand = cmd;
    this.viewDialogVisible = true;
  }

  sendCommand() {
    if (!this.newCommand.commandType || !this.newCommand.targetId) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى ملء جميع الحقول المطلوبة' });
      return;
    }

    this.sending = true;
    this.http.post(`${this.apiUrl}/v1/scada/commands`, this.newCommand).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إرسال الأمر بنجاح' });
        this.sendDialogVisible = false;
        this.sending = false;
        this.loadCommands();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل في إرسال الأمر' });
        this.sending = false;
      },
    });
  }

  cancelCommand(cmd: Command) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من إلغاء هذا الأمر؟',
      header: 'تأكيد الإلغاء',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم',
      rejectLabel: 'لا',
      accept: () => {
        this.http.put(`${this.apiUrl}/v1/scada/commands/${cmd.id}/cancel`, {}).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إلغاء الأمر' });
            this.loadCommands();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل في إلغاء الأمر' });
          },
        });
      },
    });
  }

  retryCommand(cmd: Command) {
    this.http.put(`${this.apiUrl}/v1/scada/commands/${cmd.id}/retry`, {}).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إعادة إرسال الأمر' });
        this.loadCommands();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل في إعادة الأمر' });
      },
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      disconnect: 'فصل', connect: 'وصل', restart: 'إعادة تشغيل',
      read: 'قراءة', write: 'كتابة', calibrate: 'معايرة', test: 'اختبار',
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      disconnect: 'danger', connect: 'success', restart: 'warn',
      read: 'info', write: 'info', calibrate: 'secondary', test: 'secondary',
    };
    return severities[type] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'قيد الانتظار', executing: 'قيد التنفيذ', completed: 'مكتمل',
      failed: 'فشل', cancelled: 'ملغي',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      pending: 'warn', executing: 'info', completed: 'success', failed: 'danger', cancelled: 'secondary',
    };
    return severities[status] || 'secondary';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'منخفضة', normal: 'عادية', high: 'عالية', critical: 'حرجة',
    };
    return labels[priority] || priority;
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      low: 'secondary', normal: 'info', high: 'warn', critical: 'danger',
    };
    return severities[priority] || 'secondary';
  }
}
