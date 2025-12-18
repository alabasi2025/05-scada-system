import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WebSocketService } from '../../core/services/websocket.service';

Chart.register(...registerables);

interface ChartDataPoint {
  timestamp: Date;
  value: number;
}

@Component({
  selector: 'app-live-charts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="charts-container">
      <div class="charts-header">
        <h2>الرسوم البيانية الحية</h2>
        <div class="controls">
          <div class="control-group">
            <label>المحطة:</label>
            <select [(ngModel)]="selectedStationId" (change)="onStationChange()">
              <option value="">اختر محطة</option>
              @for (station of stations; track station.id) {
                <option [value]="station.id">{{ station.code }} - {{ station.name }}</option>
              }
            </select>
          </div>
          <div class="control-group">
            <label>الجهاز:</label>
            <select [(ngModel)]="selectedDeviceId" (change)="onDeviceChange()">
              <option value="">اختر جهاز</option>
              @for (device of devices; track device.id) {
                <option [value]="device.id">{{ device.code }} - {{ device.name }}</option>
              }
            </select>
          </div>
          <div class="control-group">
            <label>الفترة:</label>
            <select [(ngModel)]="timeRange" (change)="onTimeRangeChange()">
              <option value="1h">ساعة واحدة</option>
              <option value="6h">6 ساعات</option>
              <option value="24h">24 ساعة</option>
              <option value="7d">7 أيام</option>
            </select>
          </div>
          <button class="refresh-btn" (click)="refreshData()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <div class="charts-grid">
        <!-- Voltage Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>الجهد الكهربائي (V)</h3>
            <div class="chart-stats">
              <span class="stat">
                <span class="label">الحالي:</span>
                <span class="value">{{ currentVoltage | number:'1.1-1' }} V</span>
              </span>
              <span class="stat">
                <span class="label">المتوسط:</span>
                <span class="value">{{ avgVoltage | number:'1.1-1' }} V</span>
              </span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas #voltageChart></canvas>
          </div>
        </div>

        <!-- Current Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>التيار الكهربائي (A)</h3>
            <div class="chart-stats">
              <span class="stat">
                <span class="label">الحالي:</span>
                <span class="value">{{ currentCurrent | number:'1.2-2' }} A</span>
              </span>
              <span class="stat">
                <span class="label">الأقصى:</span>
                <span class="value">{{ maxCurrent | number:'1.2-2' }} A</span>
              </span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas #currentChart></canvas>
          </div>
        </div>

        <!-- Power Chart -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>القدرة الكهربائية (kW)</h3>
            <div class="chart-stats">
              <span class="stat">
                <span class="label">الحالية:</span>
                <span class="value">{{ currentPower | number:'1.2-2' }} kW</span>
              </span>
              <span class="stat">
                <span class="label">الذروة:</span>
                <span class="value">{{ peakPower | number:'1.2-2' }} kW</span>
              </span>
              <span class="stat">
                <span class="label">الإجمالي:</span>
                <span class="value">{{ totalEnergy | number:'1.0-0' }} kWh</span>
              </span>
            </div>
          </div>
          <div class="chart-wrapper large">
            <canvas #powerChart></canvas>
          </div>
        </div>

        <!-- Frequency Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>التردد (Hz)</h3>
            <div class="chart-stats">
              <span class="stat">
                <span class="label">الحالي:</span>
                <span class="value">{{ currentFrequency | number:'1.2-2' }} Hz</span>
              </span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas #frequencyChart></canvas>
          </div>
        </div>

        <!-- Power Factor Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>معامل القدرة (PF)</h3>
            <div class="chart-stats">
              <span class="stat">
                <span class="label">الحالي:</span>
                <span class="value">{{ currentPF | number:'1.3-3' }}</span>
              </span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas #pfChart></canvas>
          </div>
        </div>
      </div>

      <!-- Real-time Values Panel -->
      <div class="realtime-panel">
        <h3>القيم الحية</h3>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon voltage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="value-info">
              <span class="value-label">الجهد</span>
              <span class="value-number">{{ currentVoltage | number:'1.1-1' }}</span>
              <span class="value-unit">V</span>
            </div>
          </div>
          <div class="value-card">
            <div class="value-icon current">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <div class="value-info">
              <span class="value-label">التيار</span>
              <span class="value-number">{{ currentCurrent | number:'1.2-2' }}</span>
              <span class="value-unit">A</span>
            </div>
          </div>
          <div class="value-card">
            <div class="value-icon power">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="value-info">
              <span class="value-label">القدرة</span>
              <span class="value-number">{{ currentPower | number:'1.2-2' }}</span>
              <span class="value-unit">kW</span>
            </div>
          </div>
          <div class="value-card">
            <div class="value-icon frequency">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12h4l3-9 4 18 3-9h4" />
              </svg>
            </div>
            <div class="value-info">
              <span class="value-label">التردد</span>
              <span class="value-number">{{ currentFrequency | number:'1.2-2' }}</span>
              <span class="value-unit">Hz</span>
            </div>
          </div>
          <div class="value-card">
            <div class="value-icon pf">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="value-info">
              <span class="value-label">معامل القدرة</span>
              <span class="value-number">{{ currentPF | number:'1.3-3' }}</span>
              <span class="value-unit">PF</span>
            </div>
          </div>
          <div class="value-card">
            <div class="value-icon energy">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div class="value-info">
              <span class="value-label">الطاقة</span>
              <span class="value-number">{{ totalEnergy | number:'1.0-0' }}</span>
              <span class="value-unit">kWh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .charts-container {
      padding: 1.5rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    .charts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .charts-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #1e293b;
    }

    .controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .control-group label {
      font-size: 0.875rem;
      color: #64748b;
    }

    .control-group select {
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      font-size: 0.875rem;
      min-width: 150px;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .refresh-btn:hover {
      background: #1d4ed8;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .chart-card.full-width {
      grid-column: span 2;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .chart-header h3 {
      margin: 0;
      font-size: 1rem;
      color: #1e293b;
    }

    .chart-stats {
      display: flex;
      gap: 1.5rem;
    }

    .chart-stats .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .chart-stats .label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .chart-stats .value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .chart-wrapper {
      height: 200px;
      position: relative;
    }

    .chart-wrapper.large {
      height: 300px;
    }

    .realtime-panel {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .realtime-panel h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #1e293b;
    }

    .values-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 1rem;
    }

    .value-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .value-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .value-icon svg {
      width: 24px;
      height: 24px;
    }

    .value-icon.voltage {
      background: #fef3c7;
      color: #d97706;
    }

    .value-icon.current {
      background: #dbeafe;
      color: #2563eb;
    }

    .value-icon.power {
      background: #d1fae5;
      color: #059669;
    }

    .value-icon.frequency {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .value-icon.pf {
      background: #fce7f3;
      color: #db2777;
    }

    .value-icon.energy {
      background: #fee2e2;
      color: #dc2626;
    }

    .value-info {
      display: flex;
      flex-direction: column;
    }

    .value-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .value-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .value-unit {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    @media (max-width: 1200px) {
      .values-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .chart-card.full-width {
        grid-column: span 1;
      }

      .values-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .controls {
        width: 100%;
      }

      .control-group {
        flex: 1;
      }

      .control-group select {
        width: 100%;
      }
    }
  `]
})
export class LiveChartsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('voltageChart') voltageChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('currentChart') currentChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('powerChart') powerChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('frequencyChart') frequencyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pfChart') pfChartRef!: ElementRef<HTMLCanvasElement>;

  private voltageChart?: Chart;
  private currentChart?: Chart;
  private powerChart?: Chart;
  private frequencyChart?: Chart;
  private pfChart?: Chart;
  private updateSubscription?: Subscription;
  private wsSubscription?: Subscription;

  stations: any[] = [];
  devices: any[] = [];
  selectedStationId = '';
  selectedDeviceId = '';
  timeRange = '1h';

  // Current values
  currentVoltage = 220;
  currentCurrent = 15;
  currentPower = 3.3;
  currentFrequency = 50;
  currentPF = 0.98;
  totalEnergy = 12500;

  // Stats
  avgVoltage = 220;
  maxCurrent = 20;
  peakPower = 5;

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadStations();
    this.startRealtimeUpdates();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
    this.wsSubscription?.unsubscribe();
    this.destroyCharts();
  }

  loadStations(): void {
    this.http.get<any[]>(`${environment.apiUrl}/stations`).subscribe(stations => {
      this.stations = stations;
      if (stations.length > 0) {
        this.selectedStationId = stations[0].id;
        this.onStationChange();
      }
    });
  }

  onStationChange(): void {
    if (this.selectedStationId) {
      this.http.get<any[]>(`${environment.apiUrl}/devices?stationId=${this.selectedStationId}`).subscribe(devices => {
        this.devices = devices;
        if (devices.length > 0) {
          this.selectedDeviceId = devices[0].id;
          this.onDeviceChange();
        }
      });
    }
  }

  onDeviceChange(): void {
    this.refreshData();
  }

  onTimeRangeChange(): void {
    this.refreshData();
  }

  refreshData(): void {
    // في الإنتاج، سيتم جلب البيانات من API
    this.updateCharts();
  }

  startRealtimeUpdates(): void {
    // تحديث البيانات كل 5 ثواني
    this.updateSubscription = interval(5000).subscribe(() => {
      this.simulateRealtimeData();
    });

    // الاستماع لتحديثات WebSocket
    this.wsSubscription = this.wsService.readings$.subscribe((message: any) => {
      this.handleNewReading(message.data);
    });
  }

  simulateRealtimeData(): void {
    // محاكاة بيانات حية
    this.currentVoltage = 220 + (Math.random() - 0.5) * 10;
    this.currentCurrent = 15 + (Math.random() - 0.5) * 5;
    this.currentPower = this.currentVoltage * this.currentCurrent / 1000;
    this.currentFrequency = 50 + (Math.random() - 0.5) * 0.2;
    this.currentPF = 0.95 + Math.random() * 0.05;
    this.totalEnergy += this.currentPower / 720; // تقريب للساعة

    this.updateCharts();
  }

  handleNewReading(reading: any): void {
    // معالجة القراءات الجديدة من WebSocket
    if (reading.deviceId === this.selectedDeviceId) {
      // تحديث القيم حسب نوع القراءة
    }
  }

  initCharts(): void {
    this.initVoltageChart();
    this.initCurrentChart();
    this.initPowerChart();
    this.initFrequencyChart();
    this.initPFChart();
  }

  destroyCharts(): void {
    this.voltageChart?.destroy();
    this.currentChart?.destroy();
    this.powerChart?.destroy();
    this.frequencyChart?.destroy();
    this.pfChart?.destroy();
  }

  initVoltageChart(): void {
    if (!this.voltageChartRef) return;
    const ctx = this.voltageChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.generateTimeLabels();
    const data = this.generateRandomData(220, 10);

    this.voltageChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'الجهد (V)',
          data,
          borderColor: '#d97706',
          backgroundColor: 'rgba(217, 119, 6, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: this.getChartOptions()
    });
  }

  initCurrentChart(): void {
    if (!this.currentChartRef) return;
    const ctx = this.currentChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.generateTimeLabels();
    const data = this.generateRandomData(15, 5);

    this.currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'التيار (A)',
          data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: this.getChartOptions()
    });
  }

  initPowerChart(): void {
    if (!this.powerChartRef) return;
    const ctx = this.powerChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.generateTimeLabels();

    this.powerChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'القدرة الفعالة (kW)',
            data: this.generateRandomData(3.3, 0.5),
            borderColor: '#059669',
            tension: 0.4
          },
          {
            label: 'القدرة الظاهرية (kVA)',
            data: this.generateRandomData(3.5, 0.5),
            borderColor: '#d97706',
            tension: 0.4
          }
        ]
      },
      options: this.getChartOptions()
    });
  }

  initFrequencyChart(): void {
    if (!this.frequencyChartRef) return;
    const ctx = this.frequencyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.generateTimeLabels();
    const data = this.generateRandomData(50, 0.1);

    this.frequencyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'التردد (Hz)',
          data,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: this.getChartOptions()
    });
  }

  initPFChart(): void {
    if (!this.pfChartRef) return;
    const ctx = this.pfChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.generateTimeLabels();
    const data = this.generateRandomData(0.98, 0.02);

    this.pfChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'معامل القدرة',
          data,
          borderColor: '#db2777',
          backgroundColor: 'rgba(219, 39, 119, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: this.getChartOptions()
    });
  }

  updateCharts(): void {
    const newLabel = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    this.updateSingleChart(this.voltageChart, newLabel, this.currentVoltage);
    this.updateSingleChart(this.currentChart, newLabel, this.currentCurrent);
    this.updateSingleChart(this.frequencyChart, newLabel, this.currentFrequency);
    this.updateSingleChart(this.pfChart, newLabel, this.currentPF);

    if (this.powerChart) {
      this.powerChart.data.labels?.push(newLabel);
      this.powerChart.data.datasets[0].data.push(this.currentPower);
      this.powerChart.data.datasets[1].data.push(this.currentPower / this.currentPF);

      if ((this.powerChart.data.labels?.length || 0) > 20) {
        this.powerChart.data.labels?.shift();
        this.powerChart.data.datasets[0].data.shift();
        this.powerChart.data.datasets[1].data.shift();
      }

      this.powerChart.update('none');
    }
  }

  updateSingleChart(chart: Chart | undefined, label: string, value: number): void {
    if (!chart) return;

    chart.data.labels?.push(label);
    chart.data.datasets[0].data.push(value);

    if ((chart.data.labels?.length || 0) > 20) {
      chart.data.labels?.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.update('none');
  }

  generateTimeLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 19; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3 * 60000);
      labels.push(time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
    }
    return labels;
  }

  generateRandomData(base: number, variance: number): number[] {
    return Array.from({ length: 20 }, () => base + (Math.random() - 0.5) * variance * 2);
  }

  getChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          }
        },
        y: {
          display: true,
          grid: {
            color: '#f1f5f9'
          }
        }
      }
    };
  }
}
