import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ApiError } from '../models';
import { NotificationService } from '../../shared/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message = resolveMessage(error);
        if (message) {
          notifications.error(message);
        }
      }
      return throwError(() => error);
    }),
  );
};

function resolveMessage(error: HttpErrorResponse): string | null {
  const apiError = error.error as ApiError | null;
  const backendMessage = apiError?.message;

  switch (error.status) {
    case 0:
      return 'No se pudo conectar con el servidor.';
    case 401:
      return null;
    case 400:
      return apiError?.fields ? null : (backendMessage ?? 'La solicitud no es válida.');
    case 403:
      return backendMessage ?? 'No tienes permiso para realizar esta acción.';
    case 404:
      return backendMessage ?? 'No se encontró el recurso solicitado.';
    case 409:
      return backendMessage ?? 'La operación no se pudo completar.';
    default:
      return backendMessage ?? 'Ocurrió un error. Intenta de nuevo.';
  }
}
