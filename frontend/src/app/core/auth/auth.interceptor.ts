import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';

import { AuthResponse } from '../models';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  // Login/refresh no llevan Bearer (el refresh manda su token en el body).
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const accessToken = tokenStorage.accessToken;
  const authedReq = accessToken ? withBearer(req, accessToken) : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      const shouldRefresh =
        error instanceof HttpErrorResponse && error.status === 401 && !!tokenStorage.refreshToken;
      if (shouldRefresh) {
        return handleUnauthorized(req, next, authService);
      }
      return throwError(() => error);
    }),
  );
};

function handleUnauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshedToken$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(withBearer(req, token))),
    );
  }

  isRefreshing = true;
  refreshedToken$.next(null);

  return authService.refresh().pipe(
    switchMap((auth: AuthResponse) => {
      isRefreshing = false;
      refreshedToken$.next(auth.accessToken);
      return next(withBearer(req, auth.accessToken));
    }),
    catchError((refreshError: unknown) => {
      isRefreshing = false;
      authService.logout();
      return throwError(() => refreshError);
    }),
  );
}
