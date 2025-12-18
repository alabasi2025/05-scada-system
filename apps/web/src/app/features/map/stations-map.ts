import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';

interface Station {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
  voltage: string;
  capacity: number;
  deviceCount: number;
  activeAlarms: number;
}

@Component({
  selector: 'app-stations-map',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="map-container">
      <div class="map-header">
        <h2>خريطة المحطات</h2>
        <div class="map-controls">
          <div class="legend">
            <div class="legend-item">
              <span class="marker online"></span>
              <span>متصلة</span>
            </div>
            <div class="legend-item">
              <span class="marker offline"></span>
              <span>غير متصلة</span>
            </div>
            <div class="legend-item">
              <span class="marker maintenance"></span>
              <span>صيانة</span>
            </div>
            <div class="legend-item">
              <span class="marker alarm"></span>
              <span>تنبيه نشط</span>
            </div>
          </div>
          <div class="filter-buttons">
            <button 
              [class.active]="filter === 'all'" 
              (click)="setFilter('all')">
              الكل
            </button>
            <button 
              [class.active]="filter === 'online'" 
              (click)="setFilter('online')">
              متصلة
            </button>
            <button 
              [class.active]="filter === 'offline'" 
              (click)="setFilter('offline')">
              غير متصلة
            </button>
            <button 
              [class.active]="filter === 'alarms'" 
              (click)="setFilter('alarms')">
              تنبيهات
            </button>
          </div>
        </div>
      </div>
      
      <div class="map-wrapper">
        <div #mapContainer id="map" class="map"></div>
        
        <!-- Station Info Panel -->
        @if (selectedStation) {
          <div class="station-panel">
            <div class="panel-header">
              <h3>{{ selectedStation.name }}</h3>
              <button class="close-btn" (click)="closePanel()">×</button>
            </div>
            <div class="panel-content">
              <div class="info-row">
                <span class="label">الكود:</span>
                <span class="value">{{ selectedStation.code }}</span>
              </div>
              <div class="info-row">
                <span class="label">النوع:</span>
                <span class="value">{{ getStationTypeLabel(selectedStation.type) }}</span>
              </div>
              <div class="info-row">
                <span class="label">الجهد:</span>
                <span class="value">{{ selectedStation.voltage }}</span>
              </div>
              <div class="info-row">
                <span class="label">السعة:</span>
                <span class="value">{{ selectedStation.capacity }} MVA</span>
              </div>
              <div class="info-row">
                <span class="label">الحالة:</span>
                <span class="value status" [class]="selectedStation.status">
                  {{ getStatusLabel(selectedStation.status) }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">الأجهزة:</span>
                <span class="value">{{ selectedStation.deviceCount }}</span>
              </div>
              <div class="info-row">
                <span class="label">التنبيهات:</span>
                <span class="value" [class.has-alarms]="selectedStation.activeAlarms > 0">
                  {{ selectedStation.activeAlarms }}
                </span>
              </div>
              <a [routerLink]="['/stations', selectedStation.id]" class="view-details-btn">
                عرض التفاصيل
              </a>
            </div>
          </div>
        }
      </div>
      
      <!-- Stations List -->
      <div class="stations-list-section">
        <h3>قائمة المحطات ({{ filteredStations.length }})</h3>
        <div class="stations-grid">
          @for (station of filteredStations; track station.id) {
            <div 
              class="station-item" 
              [class.selected]="selectedStation?.id === station.id"
              [class]="station.status"
              (click)="selectStation(station)">
              <div class="station-icon" [class]="station.type">
                @switch (station.type) {
                  @case ('main') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  @case ('sub') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  @case ('distribution') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  }
                  @case ('solar') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                }
              </div>
              <div class="station-info">
                <span class="station-code">{{ station.code }}</span>
                <span class="station-name">{{ station.name }}</span>
              </div>
              @if (station.activeAlarms > 0) {
                <span class="alarm-badge">{{ station.activeAlarms }}</span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .map-header {
      padding: 1rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .map-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #1e293b;
    }

    .map-controls {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .legend {
      display: flex;
      gap: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .legend-item .marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .marker.online {
      background: #059669;
    }

    .marker.offline {
      background: #dc2626;
    }

    .marker.maintenance {
      background: #d97706;
    }

    .marker.alarm {
      background: #dc2626;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .filter-buttons button {
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .filter-buttons button:hover {
      border-color: #2563eb;
      color: #2563eb;
    }

    .filter-buttons button.active {
      background: #2563eb;
      border-color: #2563eb;
      color: white;
    }

    .map-wrapper {
      flex: 1;
      position: relative;
      min-height: 400px;
    }

    .map {
      width: 100%;
      height: 100%;
    }

    .station-panel {
      position: absolute;
      top: 1rem;
      left: 1rem;
      width: 300px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
      color: #1e293b;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
    }

    .close-btn:hover {
      color: #1e293b;
    }

    .panel-content {
      padding: 1rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-row:last-of-type {
      border-bottom: none;
    }

    .info-row .label {
      color: #64748b;
      font-size: 0.875rem;
    }

    .info-row .value {
      color: #1e293b;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .info-row .value.status.online {
      color: #059669;
    }

    .info-row .value.status.offline {
      color: #dc2626;
    }

    .info-row .value.has-alarms {
      color: #dc2626;
      font-weight: 700;
    }

    .view-details-btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      margin-top: 1rem;
      background: #2563eb;
      color: white;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .view-details-btn:hover {
      background: #1d4ed8;
    }

    .stations-list-section {
      padding: 1rem 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .stations-list-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #1e293b;
    }

    .stations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .station-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .station-item:hover {
      border-color: #2563eb;
      background: #f0f9ff;
    }

    .station-item.selected {
      border-color: #2563eb;
      background: #dbeafe;
    }

    .station-item.offline {
      opacity: 0.7;
    }

    .station-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .station-icon svg {
      width: 20px;
      height: 20px;
    }

    .station-icon.main {
      background: #dbeafe;
      color: #2563eb;
    }

    .station-icon.sub {
      background: #d1fae5;
      color: #059669;
    }

    .station-icon.distribution {
      background: #fef3c7;
      color: #d97706;
    }

    .station-icon.solar {
      background: #fce7f3;
      color: #db2777;
    }

    .station-info {
      flex: 1;
      min-width: 0;
    }

    .station-code {
      display: block;
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .station-name {
      display: block;
      color: #64748b;
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .alarm-badge {
      background: #dc2626;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      min-width: 20px;
      text-align: center;
    }

    :host ::ng-deep .leaflet-popup-content-wrapper {
      border-radius: 8px;
    }

    :host ::ng-deep .leaflet-popup-content {
      margin: 0.75rem;
    }

    :host ::ng-deep .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    :host ::ng-deep .custom-marker.online {
      background: #059669;
    }

    :host ::ng-deep .custom-marker.offline {
      background: #dc2626;
    }

    :host ::ng-deep .custom-marker.maintenance {
      background: #d97706;
    }

    :host ::ng-deep .custom-marker.has-alarm {
      animation: pulse-marker 2s infinite;
    }

    @keyframes pulse-marker {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
  `]
})
export class StationsMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map!: L.Map;
  private markers: L.Marker[] = [];

  stations: Station[] = [];
  filteredStations: Station[] = [];
  selectedStation: Station | null = null;
  filter: 'all' | 'online' | 'offline' | 'alarms' = 'all';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStations();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  initMap(): void {
    // إحداثيات افتراضية (اليمن)
    this.map = L.map('map').setView([15.3694, 44.1910], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  loadStations(): void {
    this.http.get<any[]>(`${environment.apiUrl}/stations`).subscribe(stations => {
      this.stations = stations.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        type: s.type,
        status: s.status,
        latitude: s.latitude || 15.3694 + (Math.random() - 0.5) * 2,
        longitude: s.longitude || 44.1910 + (Math.random() - 0.5) * 2,
        voltage: s.voltage,
        capacity: s.capacity || 0,
        deviceCount: s.devices?.length || 0,
        activeAlarms: s.alarms?.filter((a: any) => a.status === 'active').length || 0
      }));
      this.applyFilter();
      this.addMarkers();
    });
  }

  addMarkers(): void {
    // إزالة العلامات القديمة
    this.markers.forEach(m => m.remove());
    this.markers = [];

    this.filteredStations.forEach(station => {
      const markerColor = station.status === 'online' ? '#059669' : 
                         station.status === 'offline' ? '#dc2626' : '#d97706';
      
      const hasAlarm = station.activeAlarms > 0;

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker ${station.status} ${hasAlarm ? 'has-alarm' : ''}" 
                    style="background: ${markerColor}">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                   <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([station.latitude, station.longitude], { icon })
        .addTo(this.map)
        .on('click', () => this.selectStation(station));

      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          <strong>${station.code}</strong><br>
          <span style="color: #64748b; font-size: 0.875rem;">${station.name}</span><br>
          <span style="color: ${markerColor}; font-weight: 500;">
            ${this.getStatusLabel(station.status)}
          </span>
          ${hasAlarm ? `<br><span style="color: #dc2626;">⚠️ ${station.activeAlarms} تنبيه</span>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      this.markers.push(marker);
    });

    // تعديل حدود الخريطة لتشمل جميع العلامات
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  setFilter(filter: 'all' | 'online' | 'offline' | 'alarms'): void {
    this.filter = filter;
    this.applyFilter();
    this.addMarkers();
  }

  applyFilter(): void {
    switch (this.filter) {
      case 'online':
        this.filteredStations = this.stations.filter(s => s.status === 'online');
        break;
      case 'offline':
        this.filteredStations = this.stations.filter(s => s.status === 'offline');
        break;
      case 'alarms':
        this.filteredStations = this.stations.filter(s => s.activeAlarms > 0);
        break;
      default:
        this.filteredStations = [...this.stations];
    }
  }

  selectStation(station: Station): void {
    this.selectedStation = station;
    this.map.setView([station.latitude, station.longitude], 12);
  }

  closePanel(): void {
    this.selectedStation = null;
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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      online: 'متصلة',
      offline: 'غير متصلة',
      maintenance: 'صيانة'
    };
    return labels[status] || status;
  }
}
