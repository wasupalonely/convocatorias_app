import { Injectable } from '@angular/core';
import { AuthResponse, SessionUser } from '../models';

const ACCESS_TOKEN_KEY = 'usco.accessToken';
const REFRESH_TOKEN_KEY = 'usco.refreshToken';
const SESSION_USER_KEY = 'usco.user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  saveSession(auth: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    const user: SessionUser = {
      userId: auth.userId,
      name: auth.name,
      email: auth.email,
      role: auth.role,
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  }

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  readSession(): SessionUser | null {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      this.clear();
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
  }
}
