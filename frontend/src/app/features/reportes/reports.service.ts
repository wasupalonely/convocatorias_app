import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ReportItem } from '../../core/models';

export interface ReportDateRange {
  from?: string; // yyyy-MM-dd
  to?: string; // yyyy-MM-dd
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reportes`;

  callsByCategory(range?: ReportDateRange): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.baseUrl}/convocatorias-categoria`, { params: toParams(range) });
  }

  applicationsByCall(range?: ReportDateRange): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.baseUrl}/postulaciones-convocatoria`, { params: toParams(range) });
  }

  applicationsByResult(range?: ReportDateRange): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.baseUrl}/resultado-postulaciones`, { params: toParams(range) });
  }
}

function toParams(range?: ReportDateRange): HttpParams {
  let params = new HttpParams();
  if (range?.from) {
    params = params.set('from', range.from);
  }
  if (range?.to) {
    params = params.set('to', range.to);
  }
  return params;
}
