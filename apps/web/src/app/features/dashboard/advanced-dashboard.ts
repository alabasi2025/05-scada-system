import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

interface StationSummary {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
  deviceCount: number;
  activeAlarms: number;
  lastReading?: {
    voltage: number;
    current: number;
    power: number;
    frequency: number;
  };
}

interface SystemStats {
  totalStations: number;
  onlineStations: number;
  offlineStations: number;
  totalDevices: number;
  activeDevices: number;
  totalAlarms: number;
  criticalAlarms: number;
  warningAlarms: number;
  totalReadings: number;
  readingsToday: number;
}

@Component({
  selector: 'app-advanced-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Header Stats -->
      <div class="stats-grid">
        <div class="stat-card stations">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalStations }}</span>
            <span class="stat-label">إجمالي المحطات</span>
            <div class="stat-detail">
              <span class="online">{{ stats.onlineStations }} متصلة</span>
              <span class="offline">{{ stats.offlineStations }} غير متصلة</span>
            </div>
          </div>
        </div>

        <div class="stat-card devices">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalDevices }}</span>
            <span class="stat-label">إجمالي الأجهزة</span>
            <div class="stat-detail">
              <span class="active">{{ stats.activeDevices }} نشطة</span>
            </div>
          </div>
        </div>

        <div class="stat-card alarms" [class.has-critical]="stats.criticalAlarms > 0">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalAlarms }}</span>
            <span class="stat-label">التنبيهات النشطة</span>
            <div class="stat-detail">
              <span class="critical">{{ stats.criticalAlarms }} حرجة</span>
              <span class="warning">{{ stats.warningAlarms }} تحذيرية</span>
            </div>
          </div>
        </div>

        <div class="stat-card readings">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.readingsToday | number }}</span>
            <span class="stat-label">قراءات اليوم</span>
            <div class="stat-detail">
              <span>{{ stats.totalReadings | number }} إجمالي</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Charts Section -->
        <div class="charts-section">
          <!-- Power Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>استهلاك الطاقة (آخر 24 ساعة)</h3>
              <div class="chart-actions">
                <button (click)="refreshPowerChart()" class="btn-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="chart-container">
              <canvas #powerChart></canvas>
            </div>
          </div>

          <!-- Voltage Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>الجهد الكهربائي</h3>
            </div>
            <div class="chart-container">
              <canvas #voltageChart></canvas>
            </div>
          </div>

          <!-- Alarms Distribution -->
          <div class="chart-card small">
            <div class="chart-header">
              <h3>توزيع التنبيهات</h3>
            </div>
            <div class="chart-container">
              <canvas #alarmsChart></canvas>
            </div>
          </div>

          <!-- Station Status -->
          <div class="chart-card small">
            <div class="chart-header">
              <h3>حالة المحطات</h3>
            </div>
            <div class="chart-container">
              <canvas #stationsChart></canvas>
            </div>
          </div>
        </div>

        <!-- Stations List -->
        <div class="stations-section">
          <div class="section-header">
            <h3>المحطات</h3>
            <a routerLink="/stations" class="view-all">عرض الكل</a>
          </div>
          <div class="stations-list">
            @for (station of stations; track station.id) {
              <div class="station-card" [class.offline]="station.status === 'offline'">
                <div class="station-header">
                  <span class="station-code">{{ station.code }}</span>
                  <span class="station-status" [class]="station.status">
                    {{ station.status === 'online' ? 'متصلة' : 'غير متصلة' }}
                  </span>
                </div>
                <div class="station-name">{{ station.name }}</div>
                <div class="station-type">{{ getStationTypeLabel(station.type) }}</div>
                <div class="station-stats">
                  <div class="stat">
                    <span class="value">{{ station.deviceCount }}</span>
                    <span class="label">أجهزة</span>
                  </div>
                  <div class="stat" [class.has-alarms]="station.activeAlarms > 0">
                    <span class="value">{{ station.activeAlarms }}</span>
                    <span class="label">تنبيهات</span>
                  </div>
                </div>
                @if (station.lastReading) {
                  <div class="station-readings">
                    <div class="reading">
                      <span class="label">الجهد</span>
                      <span class="value">{{ station.lastReading.voltage | number:'1.1-1' }} V</span>
                    </div>
                    <div class="reading">
                      <span class="label">التيار</span>
                      <span class="value">{{ station.lastReading.current | number:'1.1-1' }} A</span>
                    </div>
                    <div class="reading">
                      <span class="label">القدرة</span>
                      <span class="value">{{ station.lastReading.power | number:'1.1-1' }} kW</span>
                    </div>
                  </div>
                }
                <a [routerLink]="['/stations', station.id]" class="station-link">
                  عرض التفاصيل
                </a>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Alarms -->
      <div class="alarms-section">
        <div class="section-header">
          <h3>آخر التنبيهات</h3>
          <a routerLink="/alarms" class="view-all">عرض الكل</a>
        </div>
        <div class="alarms-table">
          <table>
            <thead>
              <tr>
                <th>الوقت</th>
                <th>المحطة</th>
                <th>الرسالة</th>
                <th>الخطورة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              @for (alarm of recentAlarms; track alarm.id) {
                <tr [class]="alarm.severity">
                  <td>{{ alarm.triggeredAt | date:'HH:mm:ss' }}</td>
                  <td>{{ alarm.stationCode }}</td>
                  <td>{{ alarm.message }}</td>
                  <td>
                    <span class="severity-badge" [class]="alarm.severity">
                      {{ getSeverityLabel(alarm.severity) }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="alarm.status">
                      {{ getStatusLabel(alarm.status) }}
                    </span>
                  </td>
                </tr>
              }
              @if (recentAlarms.length === 0) {
                <tr>
                  <td colspan="5" class="no-data">لا توجد تنبيهات</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1.5rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon svg {
      width: 24px;
      height: 24px;
    }

    .stat-card.stations .stat-icon {
      background: #dbeafe;
      color: #2563eb;
    }

    .stat-card.devices .stat-icon {
      background: #d1fae5;
      color: #059669;
    }

    .stat-card.alarms .stat-icon {
      background: #fef3c7;
      color: #d97706;
    }

    .stat-card.alarms.has-critical .stat-icon {
      background: #fee2e2;
      color: #dc2626;
    }

    .stat-card.readings .stat-icon {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .stat-label {
      display: block;
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .stat-detail {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
    }

    .stat-detail .online, .stat-detail .active {
      color: #059669;
    }

    .stat-detail .offline {
      color: #dc2626;
    }

    .stat-detail .critical {
      color: #dc2626;
    }

    .stat-detail .warning {
      color: #d97706;
    }

    .main-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .chart-card:first-child {
      grid-column: span 2;
    }

    .chart-card.small {
      grid-column: span 1;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .chart-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .chart-container {
      height: 200px;
      position: relative;
    }

    .chart-card:first-child .chart-container {
      height: 250px;
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #64748b;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
    }

    .stations-section {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .view-all {
      font-size: 0.875rem;
      color: #2563eb;
      text-decoration: none;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .stations-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 500px;
      overflow-y: auto;
    }

    .station-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      transition: border-color 0.2s;
    }

    .station-card:hover {
      border-color: #2563eb;
    }

    .station-card.offline {
      opacity: 0.7;
      border-color: #fecaca;
    }

    .station-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .station-code {
      font-weight: 600;
      color: #1e293b;
    }

    .station-status {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
    }

    .station-status.online {
      background: #d1fae5;
      color: #059669;
    }

    .station-status.offline {
      background: #fee2e2;
      color: #dc2626;
    }

    .station-name {
      font-size: 0.875rem;
      color: #475569;
      margin-bottom: 0.25rem;
    }

    .station-type {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-bottom: 0.75rem;
    }

    .station-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .station-stats .stat {
      text-align: center;
    }

    .station-stats .stat .value {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .station-stats .stat .label {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .station-stats .stat.has-alarms .value {
      color: #dc2626;
    }

    .station-readings {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 6px;
      margin-bottom: 0.75rem;
    }

    .station-readings .reading {
      text-align: center;
    }

    .station-readings .reading .label {
      display: block;
      font-size: 0.625rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .station-readings .reading .value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .station-link {
      display: block;
      text-align: center;
      padding: 0.5rem;
      background: #f1f5f9;
      border-radius: 6px;
      color: #2563eb;
      text-decoration: none;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .station-link:hover {
      background: #e2e8f0;
    }

    .alarms-section {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .alarms-table {
      overflow-x: auto;
    }

    .alarms-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .alarms-table th,
    .alarms-table td {
      padding: 0.75rem;
      text-align: right;
      border-bottom: 1px solid #e2e8f0;
    }

    .alarms-table th {
      font-weight: 600;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .alarms-table tr.critical {
      background: #fef2f2;
    }

    .alarms-table tr.warning {
      background: #fffbeb;
    }

    .severity-badge,
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .severity-badge.critical {
      background: #fee2e2;
      color: #dc2626;
    }

    .severity-badge.major {
      background: #ffedd5;
      color: #ea580c;
    }

    .severity-badge.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .severity-badge.minor {
      background: #dbeafe;
      color: #2563eb;
    }

    .status-badge.active {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.acknowledged {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge.cleared {
      background: #d1fae5;
      color: #059669;
    }

    .no-data {
      text-align: center;
      color: #94a3b8;
      padding: 2rem !important;
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .main-content {
        grid-template-columns: 1fr;
      }

      .charts-section {
        order: 2;
      }

      .stations-section {
        order: 1;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .chart-card:first-child {
        grid-column: span 1;
      }
    }
  `]
})
export class AdvancedDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('powerChart') powerChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('voltageChart') voltageChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('alarmsChart') alarmsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stationsChart') stationsChartRef!: ElementRef<HTMLCanvasElement>;

  private powerChart?: Chart;
  private voltageChart?: Chart;
  private alarmsChart?: Chart;
  private stationsChart?: Chart;
  private refreshSubscription?: Subscription;

  stats: SystemStats = {
    totalStations: 0,
    onlineStations: 0,
    offlineStations: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalAlarms: 0,
    criticalAlarms: 0,
    warningAlarms: 0,
    totalReadings: 0,
    readingsToday: 0
  };

  stations: StationSummary[] = [];
  recentAlarms: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
    // تحديث البيانات كل 30 ثانية
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadData();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.powerChart?.destroy();
    this.voltageChart?.destroy();
    this.alarmsChart?.destroy();
    this.stationsChart?.destroy();
  }

  loadData(): void {
    this.loadStats();
    this.loadStations();
    this.loadRecentAlarms();
  }

  loadStats(): void {
    this.http.get<any>(`${environment.apiUrl}/stations`).subscribe(stations => {
      this.stats.totalStations = stations.length;
      this.stats.onlineStations = stations.filter((s: any) => s.status === 'online').length;
      this.stats.offlineStations = stations.filter((s: any) => s.status !== 'online').length;
    });

    this.http.get<any>(`${environment.apiUrl}/devices`).subscribe(devices => {
      this.stats.totalDevices = devices.length;
      this.stats.activeDevices = devices.filter((d: any) => d.status === 'active').length;
    });

    this.http.get<any>(`${environment.apiUrl}/alarms?status=active`).subscribe(alarms => {
      this.stats.totalAlarms = alarms.length;
      this.stats.criticalAlarms = alarms.filter((a: any) => a.severity === 'critical').length;
      this.stats.warningAlarms = alarms.filter((a: any) => a.severity === 'warning').length;
      this.updateAlarmsChart();
    });
  }

  loadStations(): void {
    this.http.get<any>(`${environment.apiUrl}/stations`).subscribe(stations => {
      this.stations = stations.map((s: any) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        type: s.type,
        status: s.status,
        latitude: s.latitude,
        longitude: s.longitude,
        deviceCount: s.devices?.length || 0,
        activeAlarms: s.alarms?.filter((a: any) => a.status === 'active').length || 0,
        lastReading: {
          voltage: 220 + Math.random() * 10 - 5,
          current: 15 + Math.random() * 5 - 2.5,
          power: 3.3 + Math.random() * 0.5 - 0.25,
          frequency: 50 + Math.random() * 0.2 - 0.1
        }
      }));
      this.updateStationsChart();
    });
  }

  loadRecentAlarms(): void {
    this.http.get<any>(`${environment.apiUrl}/alarms?limit=10`).subscribe(alarms => {
      this.recentAlarms = alarms.map((a: any) => ({
        ...a,
        stationCode: a.station?.code || a.device?.station?.code || '-'
      }));
    });
  }

  initCharts(): void {
    this.initPowerChart();
    this.initVoltageChart();
    this.initAlarmsChart();
    this.initStationsChart();
  }

  initPowerChart(): void {
    if (!this.powerChartRef) return;

    const ctx = this.powerChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data = Array.from({ length: 24 }, () => Math.random() * 100 + 50);

    this.powerChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'استهلاك الطاقة (kW)',
          data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  initVoltageChart(): void {
    if (!this.voltageChartRef) return;

    const ctx = this.voltageChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Array.from({ length: 12 }, (_, i) => `${i * 2}:00`);

    this.voltageChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Phase A',
            data: labels.map(() => 220 + Math.random() * 10 - 5),
            borderColor: '#dc2626',
            tension: 0.4
          },
          {
            label: 'Phase B',
            data: labels.map(() => 220 + Math.random() * 10 - 5),
            borderColor: '#eab308',
            tension: 0.4
          },
          {
            label: 'Phase C',
            data: labels.map(() => 220 + Math.random() * 10 - 5),
            borderColor: '#2563eb',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  initAlarmsChart(): void {
    if (!this.alarmsChartRef) return;

    const ctx = this.alarmsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.alarmsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['حرجة', 'رئيسية', 'تحذيرية', 'ثانوية'],
        datasets: [{
          data: [this.stats.criticalAlarms, 2, this.stats.warningAlarms, 1],
          backgroundColor: ['#dc2626', '#ea580c', '#d97706', '#2563eb']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  initStationsChart(): void {
    if (!this.stationsChartRef) return;

    const ctx = this.stationsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.stationsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['متصلة', 'غير متصلة', 'صيانة'],
        datasets: [{
          data: [this.stats.onlineStations, this.stats.offlineStations, 0],
          backgroundColor: ['#059669', '#dc2626', '#d97706']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  updateAlarmsChart(): void {
    if (this.alarmsChart) {
      this.alarmsChart.data.datasets[0].data = [
        this.stats.criticalAlarms,
        2,
        this.stats.warningAlarms,
        1
      ];
      this.alarmsChart.update();
    }
  }

  updateStationsChart(): void {
    if (this.stationsChart) {
      this.stationsChart.data.datasets[0].data = [
        this.stats.onlineStations,
        this.stats.offlineStations,
        0
      ];
      this.stationsChart.update();
    }
  }

  refreshPowerChart(): void {
    if (this.powerChart) {
      const newData = Array.from({ length: 24 }, () => Math.random() * 100 + 50);
      this.powerChart.data.datasets[0].data = newData;
      this.powerChart.update();
    }
  }

  getStationTypeLabel(type: string): string {
    const types: Record<string, string> = {
      main: 'محطة رئيسية',
      sub: 'محطة فرعية',
      distribution: 'محطة توزيع',
      solar: 'محطة شمسية'
    };
    return types[type] || type;
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      critical: 'حرج',
      major: 'رئيسي',
      warning: 'تحذير',
      minor: 'ثانوي'
    };
    return labels[severity] || severity;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      acknowledged: 'معترف به',
      cleared: 'تم المسح'
    };
    return labels[status] || status;
  }
}
