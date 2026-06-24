import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

import { ApiError } from '../core/models';

// Mapea los errores de validacion del backend (400 con `fields`) a cada control del
// formulario como error `server`, para mostrarlos junto al campo. Devuelve true si
// los manejo (y por tanto no hace falta otra notificacion).
export function applyServerFieldErrors(form: FormGroup, error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 400) {
    return false;
  }

  const fields = (error.error as ApiError | null)?.fields;
  if (!fields) {
    return false;
  }

  for (const [fieldName, message] of Object.entries(fields)) {
    const control = form.get(fieldName);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
    }
  }
  return true;
}
