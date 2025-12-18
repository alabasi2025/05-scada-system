import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Device, DataPoint, Reading, LiveReading, PaginatedResponse, Statistics } from '../models';

export interface DeviceQuery {
  page?: number;
  limit?: number;
  stationId?: string;
  type?: string;
  status?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  private api = inject(ApiService);

  getAll(query?: DeviceQuery): Observable<PaginatedResponse<Device>> {
    return this.api.get<PaginatedResponse<Device>>('devices', query);
  }

  getById(id: string): Observable<Device> {
    return this.api.get<Device>(`devices/${id}`);
  }

  create(device: Partial<Device>): Observable<Device> {
    return this.api.post<Device>('devices', device);
  }

  update(id: string, device: Partial<Device>): Observable<Device> {
    return this.api.put<Device>(`devices/${id}`, device);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`devices/${id}`);
  }

  getDataPoints(id: string): Observable<DataPoint[]> {
    return this.api.get<DataPoint[]>(`devices/${id}/data-points`);
  }

  getReadings(id: string, startDate?: string, endDate?: string, limit?: number): Observable<Reading[]> {
    return this.api.get<Reading[]>(`devices/${id}/readings`, { startDate, endDate, limit });
  }

  getLatestReadings(id: string): Observable<LiveReading[]> {
    return this.api.get<LiveReading[]>(`devices/${id}/latest-readings`);
  }

  getStatistics(): Observable<Statistics> {
    return this.api.get<Statistics>('devices/statistics');
  }
}
