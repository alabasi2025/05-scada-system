import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Station, Device, Alert, ControlCommand, ApiResponse, DashboardStats } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ScadaService {
  private api = inject(ApiService);

  // Stations
  getStations(params?: { skip?: number; take?: number; status?: string; limit?: number }): Observable<ApiResponse<Station>> {
    const queryParams = params ? { ...params, limit: params.take } : undefined;
    return this.api.get<any>('/v1/scada/stations', queryParams as Record<string, string | number>).pipe(
      tap(response => console.log('getStations raw response:', response)),
      map(response => {
        // Handle both { data: [...], meta: {...} } and direct array responses
        if (Array.isArray(response)) {
          return { data: response, meta: { total: response.length, page: 1, limit: 20, totalPages: 1 } };
        }
        return response as ApiResponse<Station>;
      })
    );
  }

  getStation(id: string): Observable<Station> {
    return this.api.get<Station>(`/v1/scada/stations/${id}`);
  }

  // Devices
  getDevices(params?: { skip?: number; take?: number; stationId?: string }): Observable<ApiResponse<Device>> {
    return this.api.get<any>('/v1/scada/devices', params as Record<string, string | number>).pipe(
      tap(response => console.log('getDevices raw response:', response)),
      map(response => {
        if (Array.isArray(response)) {
          return { data: response, meta: { total: response.length, page: 1, limit: 20, totalPages: 1 } };
        }
        return response as ApiResponse<Device>;
      })
    );
  }

  getDevice(id: string): Observable<Device> {
    return this.api.get<Device>(`/v1/scada/devices/${id}`);
  }

  // Alerts
  getAlerts(params?: { skip?: number; take?: number; status?: string; severity?: string; limit?: number }): Observable<ApiResponse<Alert>> {
    const queryParams = params ? { ...params, limit: params.take } : undefined;
    return this.api.get<any>('/v1/scada/alerts', queryParams as Record<string, string | number>).pipe(
      tap(response => console.log('getAlerts raw response:', response)),
      map(response => {
        if (Array.isArray(response)) {
          return { data: response, meta: { total: response.length, page: 1, limit: 20, totalPages: 1 } };
        }
        return response as ApiResponse<Alert>;
      })
    );
  }

  acknowledgeAlert(id: string, acknowledgedBy: string): Observable<Alert> {
    return this.api.patch<Alert>(`/v1/scada/alerts/${id}/acknowledge`, { acknowledgedBy });
  }

  clearAlert(id: string): Observable<Alert> {
    return this.api.patch<Alert>(`/v1/scada/alerts/${id}/clear`, {});
  }

  // Commands
  getCommands(params?: { skip?: number; take?: number; status?: string }): Observable<ApiResponse<ControlCommand>> {
    return this.api.get<ApiResponse<ControlCommand>>('/v1/scada/commands', params as Record<string, string | number>);
  }

  createCommand(command: Partial<ControlCommand>): Observable<ControlCommand> {
    return this.api.post<ControlCommand>('/v1/scada/commands', command);
  }

  // Dashboard Stats
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      stations: this.getStations(),
      devices: this.getDevices(),
      alerts: this.getAlerts({ status: 'active' }),
    }).pipe(
      map(({ stations, devices, alerts }) => {
        const stationsData = stations.data || [];
        const devicesData = devices.data || [];
        const alertsData = alerts.data || [];

        return {
          totalStations: stationsData.length,
          onlineStations: stationsData.filter((s) => s.status === 'online').length,
          totalDevices: devicesData.length,
          activeDevices: devicesData.filter((d) => d.status === 'active').length,
          activeAlerts: alertsData.length,
          criticalAlerts: alertsData.filter((a) => a.severity === 'critical').length,
          warningAlerts: alertsData.filter((a) => a.severity === 'medium' || a.severity === 'low').length,
        };
      })
    );
  }
}
