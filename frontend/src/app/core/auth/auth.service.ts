import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, Role, SessionUser } from '../models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  private readonly currentUserSignal = signal<SessionUser | null>(this.tokenStorage.readSession());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly role = computed<Role | null>(() => this.currentUserSignal()?.role ?? null);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(tap((auth) => this.persist(auth)));
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.tokenStorage.refreshToken;
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(tap((auth) => this.persist(auth)));
  }

  logout(): void {
    this.tokenStorage.clear();
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  homeRoute(): string {
    return '/inicio';
  }

  private persist(auth: AuthResponse): void {
    this.tokenStorage.saveSession(auth);
    this.currentUserSignal.set({
      userId: auth.userId,
      name: auth.name,
      email: auth.email,
      role: auth.role,
    });
  }
}
