import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { environment } from '../../../environments/environment';

interface QualityMetric {
  id: string;
  stationId: string;
  powerFactor: number;
  thd: number;
  voltageUnbalance: number;
  frequencyDeviation: number;
  measurementTime: string;
  station?: { name: string };
}

@Component({
  selector: 'app-quality-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TableModule, TagModule, ProgressBarModule],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">لوحة جودة الطاقة</h2>
      
      <!-- بطاقات الإحصائيات -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ avgPowerFactor() | number:'1.2-2' }}</div>
            <div class="text-gray-500">متوسط معامل القدرة</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">{{ avgThd() | number:'1.2-2' }}%</div>
            <div class="text-gray-500">متوسط THD</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ avgUnbalance() | number:'1.2-2' }}%</div>
            <div class="text-gray-500">متوسط عدم الاتزان</div>
          </div>
        </p-card>
        <p-card>
          <div class="text-center">
            <div class="text-3xl font-bold" [class]="getStatusColor()">{{ getOverallStatus() }}</div>
            <div class="text-gray-500">الحالة العامة</div>
          </div>
        </p-card>
      </div>

      <!-- رسم بياني للتوافقيات -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <p-card header="التوافقيات (Harmonics)">
          <p-chart type="bar" [data]="harmonicsChartData()" [options]="chartOptions"></p-chart>
        </p-card>
        <p-card header="معامل القدرة حسب المحطة">
          <p-chart type="doughnut" [data]="powerFactorChartData()" [options]="chartOptions"></p-chart>
        </p-card>
      </div>

      <!-- جدول المقاييس -->
      <p-card header="مقاييس الجودة التفصيلية">
        <p-table [value]="metrics()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>المحطة</th>
              <th>معامل القدرة</th>
              <th>THD</th>
              <th>عدم الاتزان</th>
              <th>انحراف التردد</th>
              <th>الحالة</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-metric>
            <tr>
              <td>{{ metric.station?.name || metric.stationId }}</td>
              <td>
                <p-progressBar [value]="metric.powerFactor * 100" [showValue]="true"></p-progressBar>
              </td>
              <td>
                <p-tag [severity]="getThdSeverity(metric.thd)" [value]="metric.thd + '%'"></p-tag>
              </td>
              <td>
                <p-tag [severity]="getUnbalanceSeverity(metric.voltageUnbalance)" [value]="metric.voltageUnbalance + '%'"></p-tag>
              </td>
              <td>{{ metric.frequencyDeviation }} Hz</td>
              <td>
                <p-tag [severity]="getOverallSeverity(metric)" [value]="getMetricStatus(metric)"></p-tag>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `
})
export class QualityDashboardComponent implements OnInit {
  metrics = signal<QualityMetric[]>([]);
  avgPowerFactor = signal<number>(0);
  avgThd = signal<number>(0);
  avgUnbalance = signal<number>(0);
  
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.http.get<any>(`${environment.apiUrl}/api/v1/scada/quality/metrics`).subscribe({
      next: (data) => {
        const metricsData = data.data || data || [];
        this.metrics.set(metricsData);
        this.calculateAverages(metricsData);
      },
      error: (err) => console.error('Error loading quality metrics', err)
    });
  }

  calculateAverages(data: QualityMetric[]) {
    if (data.length === 0) return;
    this.avgPowerFactor.set(data.reduce((a, b) => a + (b.powerFactor || 0), 0) / data.length);
    this.avgThd.set(data.reduce((a, b) => a + (b.thd || 0), 0) / data.length);
    this.avgUnbalance.set(data.reduce((a, b) => a + (b.voltageUnbalance || 0), 0) / data.length);
  }

  harmonicsChartData() {
    return {
      labels: ['THD 1', 'THD 3', 'THD 5', 'THD 7', 'THD 9', 'THD 11'],
      datasets: [{
        label: 'نسبة التوافقيات %',
        data: [5.2, 3.1, 2.8, 1.5, 0.9, 0.5],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
      }]
    };
  }

  powerFactorChartData() {
    const data = this.metrics();
    return {
      labels: data.slice(0, 5).map(m => m.station?.name || 'محطة'),
      datasets: [{
        data: data.slice(0, 5).map(m => m.powerFactor * 100),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }]
    };
  }

  getStatusColor(): string {
    const pf = this.avgPowerFactor();
    if (pf >= 0.95) return 'text-green-600';
    if (pf >= 0.85) return 'text-yellow-600';
    return 'text-red-600';
  }

  getOverallStatus(): string {
    const pf = this.avgPowerFactor();
    if (pf >= 0.95) return 'ممتاز';
    if (pf >= 0.85) return 'جيد';
    return 'يحتاج تحسين';
  }

  getThdSeverity(thd: number): 'success' | 'info' | 'warn' | 'danger' {
    if (thd <= 5) return 'success';
    if (thd <= 8) return 'warn';
    return 'danger';
  }

  getUnbalanceSeverity(unbalance: number): 'success' | 'info' | 'warn' | 'danger' {
    if (unbalance <= 2) return 'success';
    if (unbalance <= 5) return 'warn';
    return 'danger';
  }

  getOverallSeverity(metric: QualityMetric): 'success' | 'info' | 'warn' | 'danger' {
    if (metric.powerFactor >= 0.95 && metric.thd <= 5) return 'success';
    if (metric.powerFactor >= 0.85 && metric.thd <= 8) return 'warn';
    return 'danger';
  }

  getMetricStatus(metric: QualityMetric): string {
    if (metric.powerFactor >= 0.95 && metric.thd <= 5) return 'ممتاز';
    if (metric.powerFactor >= 0.85 && metric.thd <= 8) return 'مقبول';
    return 'تحذير';
  }
}
