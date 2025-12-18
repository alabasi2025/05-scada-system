import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-energy-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TableModule, TagModule, SelectModule, FormsModule],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">لوحة استهلاك الطاقة</h2>
      
      <!-- فلتر الفترة -->
      <div class="mb-4">
        <p-select [options]="periodOptions" [(ngModel)]="selectedPeriod" (onChange)="loadData()" 
                    placeholder="اختر الفترة" styleClass="w-48"></p-select>
      </div>

      <!-- بطاقات الإحصائيات -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stats().todayEnergy | number:'1.0-0' }}</div>
            <div class="text-gray-500">استهلاك اليوم (kWh)</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ stats().totalStations }}</div>
            <div class="text-gray-500">المحطات النشطة</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold" [class]="getChangeColor()">
              {{ stats().energyChangePercent | number:'1.1-1' }}%
            </div>
            <div class="text-gray-500">التغير عن أمس</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ stats().criticalAlerts }}</div>
            <div class="text-gray-500">تنبيهات حرجة</div>
          </div>
        </p-card>
      </div>

      <!-- رسوم بيانية -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <p-card header="الاستهلاك اليومي">
          <p-chart type="line" [data]="consumptionChartData()" [options]="lineChartOptions"></p-chart>
        </p-card>
        <p-card header="الاستهلاك حسب نوع المحطة">
          <p-chart type="pie" [data]="byTypeChartData()" [options]="pieChartOptions"></p-chart>
        </p-card>
      </div>

      <!-- تحليل الفقد -->
      <p-card header="تحليل الفقد في الشبكة" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div class="text-center p-4 bg-blue-50 rounded">
            <div class="text-2xl font-bold text-blue-600">{{ losses().summary?.totalInput | number:'1.0-0' }}</div>
            <div class="text-sm text-gray-500">إجمالي المدخلات (kWh)</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded">
            <div class="text-2xl font-bold text-green-600">{{ losses().summary?.totalOutput | number:'1.0-0' }}</div>
            <div class="text-sm text-gray-500">إجمالي المخرجات (kWh)</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded">
            <div class="text-2xl font-bold text-red-600">{{ losses().summary?.totalLoss | number:'1.0-0' }}</div>
            <div class="text-sm text-gray-500">إجمالي الفقد (kWh)</div>
          </div>
          <div class="text-center p-4 bg-orange-50 rounded">
            <div class="text-2xl font-bold text-orange-600">{{ losses().summary?.avgLossPercentage | number:'1.2-2' }}%</div>
            <div class="text-sm text-gray-500">نسبة الفقد</div>
          </div>
        </div>
      </p-card>

      <!-- توقعات الطاقة -->
      <p-card header="توقعات الطلب على الطاقة (7 أيام)">
        <p-chart type="bar" [data]="forecastChartData()" [options]="barChartOptions"></p-chart>
        <p-table [value]="forecast().forecast || []" styleClass="p-datatable-sm mt-4">
          <ng-template pTemplate="header">
            <tr>
              <th>التاريخ</th>
              <th>الاستهلاك المتوقع (kWh)</th>
              <th>نسبة الثقة</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>{{ item.date }}</td>
              <td>{{ item.predictedConsumption | number:'1.0-0' }}</td>
              <td>
                <p-tag [severity]="item.confidence > 0.8 ? 'success' : 'warn'" 
                       [value]="(item.confidence * 100 | number:'1.0-0') + '%'"></p-tag>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `
})
export class EnergyDashboardComponent implements OnInit {
  stats = signal<any>({});
  consumption = signal<any>({});
  losses = signal<any>({ summary: {} });
  forecast = signal<any>({ forecast: [] });
  
  selectedPeriod = 'daily';
  periodOptions = [
    { label: 'يومي', value: 'daily' },
    { label: 'أسبوعي', value: 'weekly' },
    { label: 'شهري', value: 'monthly' }
  ];

  lineChartOptions = { responsive: true, maintainAspectRatio: false };
  pieChartOptions = { responsive: true, maintainAspectRatio: false };
  barChartOptions = { responsive: true, maintainAspectRatio: false };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // تحميل إحصائيات لوحة التحكم
    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/energy/dashboard`).subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading stats', err)
    });

    // تحميل تحليل الاستهلاك
    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/energy/consumption?period=${this.selectedPeriod}`).subscribe({
      next: (data) => this.consumption.set(data),
      error: (err) => console.error('Error loading consumption', err)
    });

    // تحميل تحليل الفقد
    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/energy/losses`).subscribe({
      next: (data) => this.losses.set(data),
      error: (err) => console.error('Error loading losses', err)
    });

    // تحميل التوقعات
    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/energy/forecast?days=7`).subscribe({
      next: (data) => this.forecast.set(data),
      error: (err) => console.error('Error loading forecast', err)
    });
  }

  getChangeColor(): string {
    const change = this.stats().energyChangePercent || 0;
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-green-600';
    return 'text-gray-600';
  }

  consumptionChartData() {
    const records = this.consumption().records || [];
    return {
      labels: records.slice(0, 14).map((r: any) => r.summaryDate?.split('T')[0] || ''),
      datasets: [{
        label: 'الاستهلاك (kWh)',
        data: records.slice(0, 14).map((r: any) => r.totalConsumption || 0),
        borderColor: '#3B82F6',
        fill: false
      }]
    };
  }

  byTypeChartData() {
    const byType = this.consumption().byStationType || {};
    return {
      labels: Object.keys(byType),
      datasets: [{
        data: Object.values(byType),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }]
    };
  }

  forecastChartData() {
    const data = this.forecast().forecast || [];
    return {
      labels: data.map((f: any) => f.date),
      datasets: [{
        label: 'الاستهلاك المتوقع (kWh)',
        data: data.map((f: any) => f.predictedConsumption),
        backgroundColor: '#3B82F6'
      }]
    };
  }
}
