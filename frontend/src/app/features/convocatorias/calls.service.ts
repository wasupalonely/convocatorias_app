import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Call, CallRequest } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class CallsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/convocatorias`;

  list(): Observable<Call[]> {
    return this.http.get<Call[]>(this.baseUrl);
  }

  create(body: CallRequest): Observable<Call> {
    return this.http.post<Call>(this.baseUrl, body);
  }

  update(id: number, body: CallRequest): Observable<Call> {
    return this.http.put<Call>(`${this.baseUrl}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
