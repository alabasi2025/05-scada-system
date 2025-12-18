import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Alarm, PaginatedResponse, Statistics } from '../models';

export interface AlarmQuery {
  page?: number;
  limit?: number;
  stationId?: string;
  deviceId?: string;
  status?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlarmsService {
  private api = inject(ApiService);

  getAll(query?: AlarmQuery): Observable<PaginatedResponse<Alarm>> {
    return this.api.get<PaginatedResponse<Alarm>>('alarms', query);
  }

  getActive(): Observable<Alarm[]> {
    return this.api.get<Alarm[]>('alarms/active');
  }

  getById(id: string): Observable<Alarm> {
    return this.api.get<Alarm>(`alarms/${id}`);
  }

  acknowledge(id: string, notes?: string): Observable<Alarm> {
    return this.api.post<Alarm>(`alarms/${id}/acknowledge`, { notes });
  }

  clear(id: string, notes?: string): Observable<Alarm> {
    return this.api.post<Alarm>(`alarms/${id}/clear`, { notes });
  }

  getStatistics(): Observable<Statistics & { recentAlarms: Alarm[] }> {
    return this.api.get<Statistics & { recentAlarms: Alarm[] }>('alarms/statistics');
  }
}
