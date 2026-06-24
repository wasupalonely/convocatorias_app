import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Application, ApplicationRequest, StatusChangeRequest } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/postulaciones`;

  list(): Observable<Application[]> {
    return this.http.get<Application[]>(this.baseUrl);
  }

  create(body: ApplicationRequest): Observable<Application> {
    return this.http.post<Application>(this.baseUrl, body);
  }

  changeStatus(id: number, body: StatusChangeRequest): Observable<Application> {
    return this.http.put<Application>(`${this.baseUrl}/${id}/estado`, body);
  }
}
