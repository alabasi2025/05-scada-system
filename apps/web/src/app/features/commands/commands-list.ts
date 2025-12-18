import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services';
import { Command, CommandType, CommandStatus, PaginatedResponse } from '../../core/models';

@Component({
  selector: 'app-commands-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">أوامر التحكم</h1>
        <button (click)="showNewCommand = true" 
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          أمر جديد
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select [(ngModel)]="filters.status" (ngModelChange)="loadCommands()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="sent">تم الإرسال</option>
            <option value="executed">تم التنفيذ</option>
            <option value="failed">فشل</option>
            <option value="rejected">مرفوض</option>
          </select>

          <select [(ngModel)]="filters.commandType" (ngModelChange)="loadCommands()"
                  class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">جميع الأنواع</option>
            <option value="open">فتح</option>
            <option value="close">إغلاق</option>
            <option value="reset">إعادة تعيين</option>
            <option value="setpoint">نقطة ضبط</option>
          </select>

          <input type="date" [(ngModel)]="filters.startDate" (ngModelChange)="loadCommands()"
                 class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">

          <input type="date" [(ngModel)]="filters.endDate" (ngModelChange)="loadCommands()"
                 class="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
      </div>

      <!-- Commands Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        } @else if (commands().length === 0) {
          <div class="p-12 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">لا توجد أوامر</h3>
            <p class="mt-2 text-gray-500">لم يتم إرسال أي أوامر تحكم بعد</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr class="text-right text-sm text-gray-500 dark:text-gray-300">
                  <th class="p-4 font-medium">رقم الأمر</th>
                  <th class="p-4 font-medium">النوع</th>
                  <th class="p-4 font-medium">الجهاز</th>
                  <th class="p-4 font-medium">المحطة</th>
                  <th class="p-4 font-medium">القيمة المستهدفة</th>
                  <th class="p-4 font-medium">الحالة</th>
                  <th class="p-4 font-medium">وقت الطلب</th>
                  <th class="p-4 font-medium">وقت التنفيذ</th>
                </tr>
              </thead>
              <tbody>
                @for (cmd of commands(); track cmd.id) {
                  <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="p-4 font-mono text-gray-900 dark:text-white">{{ cmd.commandNo }}</td>
                    <td class="p-4">
                      <span class="px-2 py-1 text-xs rounded-full"
                            [class.bg-blue-100]="cmd.commandType === 'open'"
                            [class.text-blue-800]="cmd.commandType === 'open'"
                            [class.bg-green-100]="cmd.commandType === 'close'"
                            [class.text-green-800]="cmd.commandType === 'close'"
                            [class.bg-yellow-100]="cmd.commandType === 'reset'"
                            [class.text-yellow-800]="cmd.commandType === 'reset'"
                            [class.bg-purple-100]="cmd.commandType === 'setpoint'"
                            [class.text-purple-800]="cmd.commandType === 'setpoint'">
                        {{ getTypeLabel(cmd.commandType) }}
                      </span>
                    </td>
                    <td class="p-4 text-gray-900 dark:text-white">{{ cmd.device?.name }}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">{{ cmd.device?.station?.name }}</td>
                    <td class="p-4 font-mono text-gray-600 dark:text-gray-300">{{ cmd.targetValue || '-' }}</td>
                    <td class="p-4">
                      <span class="px-2 py-1 text-xs rounded-full"
                            [class.bg-yellow-100]="cmd.status === 'pending'"
                            [class.text-yellow-800]="cmd.status === 'pending'"
                            [class.bg-blue-100]="cmd.status === 'sent'"
                            [class.text-blue-800]="cmd.status === 'sent'"
                            [class.bg-green-100]="cmd.status === 'executed'"
                            [class.text-green-800]="cmd.status === 'executed'"
                            [class.bg-red-100]="cmd.status === 'failed' || cmd.status === 'rejected'"
                            [class.text-red-800]="cmd.status === 'failed' || cmd.status === 'rejected'">
                        {{ getStatusLabel(cmd.status) }}
                      </span>
                    </td>
                    <td class="p-4 text-gray-500 text-sm">{{ cmd.requestedAt | date:'short' }}</td>
                    <td class="p-4 text-gray-500 text-sm">{{ cmd.executedAt ? (cmd.executedAt | date:'short') : '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class CommandsListComponent implements OnInit {
  private api = inject(ApiService);

  commands = signal<Command[]>([]);
  loading = signal(false);
  showNewCommand = false;

  filters: any = {
    page: 1,
    limit: 20,
    status: '',
    commandType: '',
    startDate: '',
    endDate: ''
  };

  ngOnInit(): void {
    this.loadCommands();
  }

  loadCommands(): void {
    this.loading.set(true);
    this.api.get<PaginatedResponse<Command>>('commands', this.filters).subscribe({
      next: (response) => {
        this.commands.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load commands:', err);
        this.loading.set(false);
      }
    });
  }

  getTypeLabel(type: CommandType): string {
    const labels: Record<CommandType, string> = {
      open: 'فتح',
      close: 'إغلاق',
      reset: 'إعادة تعيين',
      setpoint: 'نقطة ضبط'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: CommandStatus): string {
    const labels: Record<CommandStatus, string> = {
      pending: 'قيد الانتظار',
      sent: 'تم الإرسال',
      executed: 'تم التنفيذ',
      failed: 'فشل',
      rejected: 'مرفوض'
    };
    return labels[status] || status;
  }
}
