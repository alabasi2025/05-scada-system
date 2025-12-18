import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, CardModule, Tabs, TabList, Tab, TabPanels, TabPanel,
    TableModule, Select, DatePicker, ProgressSpinnerModule, ChartModule
  ],
  template: `
    <div class="scada-card">
      <div class="scada-card-header">
        <h2 class="scada-card-title">
          <i class="pi pi-chart-bar ml-2"></i>
          التقارير والإحصائيات
        </h2>
      </div>

      <p-tabs value="0"><p-tablist><p-tab value="0">تقرير الطاقة</p-tab><p-tab value="1">تقرير التنبيهات</p-tab><p-tab value="2">تقرير الجودة</p-tab><p-tab value="3">مؤشرات الموثوقية</p-tab></p-tablist><p-tabpanels>
        <!-- تقرير الطاقة -->
        <p-tabpanel value="0">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block mb-1 text-sm font-medium">المحطة</label>
              <p-select [options]="stations" [(ngModel)]="selectedStation"
                        optionLabel="name" optionValue="id" placeholder="جميع المحطات"
                        class="w-full"></p-select>
            </div>
            <div>
              <label class="block mb-1 text-sm font-medium">من تاريخ</label>
              <p-datepicker [(ngModel)]="startDate" dateFormat="yy-mm-dd" class="w-full"></p-datepicker>
            </div>
            <div>
              <label class="block mb-1 text-sm font-medium">إلى تاريخ</label>
              <p-datepicker [(ngModel)]="endDate" dateFormat="yy-mm-dd" class="w-full"></p-datepicker>
            </div>
          </div>
          <button pButton label="إنشاء التقرير" icon="pi pi-file" (click)="generateEnergyReport()" class="mb-4"></button>

          <div *ngIf="energyLoading()" class="flex justify-center py-8">
            <p-progressSpinner strokeWidth="4"></p-progressSpinner>
          </div>

          <div *ngIf="energyReport() && !energyLoading()">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-blue-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ energyReport()?.totals?.totalConsumption | number:'1.0-0' }}</div>
                <div class="text-slate-600 text-sm">إجمالي الاستهلاك (kWh)</div>
              </div>
              <div class="bg-green-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-green-600">{{ energyReport()?.totals?.totalGeneration | number:'1.0-0' }}</div>
                <div class="text-slate-600 text-sm">إجمالي التوليد (kWh)</div>
              </div>
              <div class="bg-yellow-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-yellow-600">{{ energyReport()?.totals?.peakDemand | number:'1.0-0' }}</div>
                <div class="text-slate-600 text-sm">ذروة الطلب (kW)</div>
              </div>
              <div class="bg-purple-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-purple-600">{{ energyReport()?.totals?.avgPowerFactor | number:'1.2-2' }}</div>
                <div class="text-slate-600 text-sm">متوسط معامل القدرة</div>
              </div>
            </div>

            <!-- Data Table -->
            <p-table [value]="energyReport()?.data || []" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>المحطة</th>
                  <th>التاريخ</th>
                  <th>الاستهلاك</th>
                  <th>التوليد</th>
                  <th>الذروة</th>
                  <th>معامل القدرة</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td>{{ row.station?.name || '-' }}</td>
                  <td>{{ row.summaryDate | date:'shortDate' }}</td>
                  <td class="font-mono">{{ row.totalConsumption | number:'1.0-0' }}</td>
                  <td class="font-mono">{{ row.totalGeneration | number:'1.0-0' }}</td>
                  <td class="font-mono">{{ row.peakDemand | number:'1.0-0' }}</td>
                  <td class="font-mono">{{ row.powerFactor | number:'1.2-2' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabpanel>

        <!-- تقرير التنبيهات -->
        <p-tabpanel value="1">
          <button pButton label="تحميل التقرير" icon="pi pi-download" (click)="loadAlertsReport()" class="mb-4"></button>

          <div *ngIf="alertsLoading()" class="flex justify-center py-8">
            <p-progressSpinner strokeWidth="4"></p-progressSpinner>
          </div>

          <div *ngIf="alertsReport() && !alertsLoading()">
            <!-- Summary -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-red-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-red-600">{{ alertsReport()?.summary?.critical || 0 }}</div>
                <div class="text-slate-600 text-sm">حرجة</div>
              </div>
              <div class="bg-orange-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-orange-600">{{ alertsReport()?.summary?.high || 0 }}</div>
                <div class="text-slate-600 text-sm">عالية</div>
              </div>
              <div class="bg-yellow-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-yellow-600">{{ alertsReport()?.summary?.medium || 0 }}</div>
                <div class="text-slate-600 text-sm">متوسطة</div>
              </div>
              <div class="bg-blue-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ alertsReport()?.summary?.low || 0 }}</div>
                <div class="text-slate-600 text-sm">منخفضة</div>
              </div>
            </div>

            <p-table [value]="alertsReport()?.data || []" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>الكود</th>
                  <th>المحطة</th>
                  <th>الرسالة</th>
                  <th>الخطورة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-alert>
                <tr>
                  <td class="font-mono text-blue-600">{{ alert.alertCode }}</td>
                  <td>{{ alert.station?.name || '-' }}</td>
                  <td>{{ alert.message }}</td>
                  <td>{{ alert.severity }}</td>
                  <td>{{ alert.status }}</td>
                  <td>{{ alert.triggeredAt | date:'short' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabpanel>

        <!-- تقرير الجودة -->
        <p-tabpanel value="2">
          <button pButton label="تحميل التقرير" icon="pi pi-download" (click)="loadQualityReport()" class="mb-4"></button>

          <div *ngIf="qualityLoading()" class="flex justify-center py-8">
            <p-progressSpinner strokeWidth="4"></p-progressSpinner>
          </div>

          <div *ngIf="qualityReport() && !qualityLoading()">
            <!-- Averages -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-green-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-green-600">{{ qualityReport()?.averages?.powerFactor | number:'1.2-2' }}</div>
                <div class="text-slate-600 text-sm">متوسط معامل القدرة</div>
              </div>
              <div class="bg-blue-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ qualityReport()?.averages?.thd | number:'1.2-2' }}%</div>
                <div class="text-slate-600 text-sm">THD</div>
              </div>
              <div class="bg-yellow-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-yellow-600">{{ qualityReport()?.averages?.voltageUnbalance | number:'1.2-2' }}%</div>
                <div class="text-slate-600 text-sm">عدم توازن الجهد</div>
              </div>
              <div class="bg-purple-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-purple-600">{{ qualityReport()?.averages?.frequencyDeviation | number:'1.3-3' }}</div>
                <div class="text-slate-600 text-sm">انحراف التردد (Hz)</div>
              </div>
            </div>

            <p-table [value]="qualityReport()?.data || []" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>المحطة</th>
                  <th>التاريخ</th>
                  <th>معامل القدرة</th>
                  <th>THD</th>
                  <th>عدم التوازن</th>
                  <th>انحراف التردد</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td>{{ row.station?.name || '-' }}</td>
                  <td>{{ row.recordedAt | date:'short' }}</td>
                  <td class="font-mono">{{ row.powerFactor | number:'1.2-2' }}</td>
                  <td class="font-mono">{{ row.thd | number:'1.2-2' }}%</td>
                  <td class="font-mono">{{ row.voltageUnbalance | number:'1.2-2' }}%</td>
                  <td class="font-mono">{{ row.frequencyDeviation | number:'1.3-3' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabpanel>

        <!-- مؤشرات الموثوقية -->
        <p-tabpanel value="3">
          <button pButton label="تحميل التقرير" icon="pi pi-download" (click)="loadReliabilityReport()" class="mb-4"></button>

          <div *ngIf="reliabilityLoading()" class="flex justify-center py-8">
            <p-progressSpinner strokeWidth="4"></p-progressSpinner>
          </div>

          <div *ngIf="reliabilityReport() && !reliabilityLoading()">
            <!-- Yearly Totals -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div class="bg-red-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-red-600">{{ reliabilityReport()?.yearlyTotals?.saidi | number:'1.2-2' }}</div>
                <div class="text-slate-600 text-sm">SAIDI (دقيقة)</div>
              </div>
              <div class="bg-orange-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-orange-600">{{ reliabilityReport()?.yearlyTotals?.saifi | number:'1.2-2' }}</div>
                <div class="text-slate-600 text-sm">SAIFI</div>
              </div>
              <div class="bg-yellow-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-yellow-600">{{ reliabilityReport()?.yearlyTotals?.caidi | number:'1.2-2' }}</div>
                <div class="text-slate-600 text-sm">CAIDI (دقيقة)</div>
              </div>
              <div class="bg-green-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-green-600">{{ reliabilityReport()?.yearlyTotals?.avgAsai | number:'1.4-4' }}</div>
                <div class="text-slate-600 text-sm">ASAI</div>
              </div>
              <div class="bg-blue-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ reliabilityReport()?.yearlyTotals?.outageMinutes | number:'1.0-0' }}</div>
                <div class="text-slate-600 text-sm">إجمالي الانقطاع (دقيقة)</div>
              </div>
            </div>

            <p-table [value]="reliabilityReport()?.data || []" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>المحطة</th>
                  <th>الشهر</th>
                  <th>SAIDI</th>
                  <th>SAIFI</th>
                  <th>CAIDI</th>
                  <th>ASAI</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td>{{ row.station?.name || '-' }}</td>
                  <td>{{ row.year }}/{{ row.month }}</td>
                  <td class="font-mono">{{ row.saidi | number:'1.2-2' }}</td>
                  <td class="font-mono">{{ row.saifi | number:'1.2-2' }}</td>
                  <td class="font-mono">{{ row.caidi | number:'1.2-2' }}</td>
                  <td class="font-mono">{{ row.asai | number:'1.4-4' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabpanel>
      </p-tabpanels></p-tabs>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  stations: any[] = [];
  selectedStation = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  energyLoading = signal(false);
  alertsLoading = signal(false);
  qualityLoading = signal(false);
  reliabilityLoading = signal(false);

  energyReport = signal<any>(null);
  alertsReport = signal<any>(null);
  qualityReport = signal<any>(null);
  reliabilityReport = signal<any>(null);

  ngOnInit() {
    this.loadStations();
  }

  loadStations() {
    this.http.get<any>(`${this.apiUrl}/v1/scada/stations`).subscribe({
      next: (response) => { this.stations = response?.data || []; },
    });
  }

  generateEnergyReport() {
    this.energyLoading.set(true);
    let url = `${this.apiUrl}/v1/scada/energy/summary?`;
    if (this.selectedStation) url += `stationId=${this.selectedStation}&`;
    if (this.startDate) url += `startDate=${this.startDate.toISOString().split('T')[0]}&`;
    if (this.endDate) url += `endDate=${this.endDate.toISOString().split('T')[0]}&`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.energyReport.set(response);
        this.energyLoading.set(false);
      },
      error: () => this.energyLoading.set(false),
    });
  }

  loadAlertsReport() {
    this.alertsLoading.set(true);
    this.http.get<any>(`${this.apiUrl}/v1/scada/alerts?limit=100`).subscribe({
      next: (response) => {
        const data = response?.data || [];
        const summary = {
          critical: data.filter((a: any) => a.severity === 'critical').length,
          high: data.filter((a: any) => a.severity === 'high').length,
          medium: data.filter((a: any) => a.severity === 'medium').length,
          low: data.filter((a: any) => a.severity === 'low').length,
        };
        this.alertsReport.set({ data, summary });
        this.alertsLoading.set(false);
      },
      error: () => this.alertsLoading.set(false),
    });
  }

  loadQualityReport() {
    this.qualityLoading.set(true);
    this.http.get<any>(`${this.apiUrl}/v1/scada/quality/metrics`).subscribe({
      next: (response) => {
        this.qualityReport.set(response);
        this.qualityLoading.set(false);
      },
      error: () => this.qualityLoading.set(false),
    });
  }

  loadReliabilityReport() {
    this.reliabilityLoading.set(true);
    this.http.get<any>(`${this.apiUrl}/v1/scada/quality/reliability`).subscribe({
      next: (response) => {
        this.reliabilityReport.set(response);
        this.reliabilityLoading.set(false);
      },
      error: () => this.reliabilityLoading.set(false),
    });
  }
}
