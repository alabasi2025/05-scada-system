import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Station, Device, Reading, Alarm, PaginatedResponse, Statistics } from '../models';

export interface StationQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  voltage?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StationsService {
  private api = inject(ApiService);

  getAll(query?: StationQuery): Observable<PaginatedResponse<Station>> {
    return this.api.get<PaginatedResponse<Station>>('stations', query);
  }

  getById(id: string): Observable<Station> {
    return this.api.get<Station>(`stations/${id}`);
  }

  create(station: Partial<Station>): Observable<Station> {
    return this.api.post<Station>('stations', station);
  }

  update(id: string, station: Partial<Station>): Observable<Station> {
    return this.api.put<Station>(`stations/${id}`, station);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`stations/${id}`);
  }

  getDevices(id: string): Observable<Device[]> {
    return this.api.get<Device[]>(`stations/${id}/devices`);
  }

  getReadings(id: string, startDate?: string, endDate?: string): Observable<Reading[]> {
    return this.api.get<Reading[]>(`stations/${id}/readings`, { startDate, endDate });
  }

  getAlarms(id: string, status?: string): Observable<Alarm[]> {
    return this.api.get<Alarm[]>(`stations/${id}/alarms`, { status });
  }

  getMapData(): Observable<Station[]> {
    return this.api.get<Station[]>('stations/map');
  }

  getStatistics(): Observable<Statistics> {
    return this.api.get<Statistics>('stations/statistics');
  }
}
