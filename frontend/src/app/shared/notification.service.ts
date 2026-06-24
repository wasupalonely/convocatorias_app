import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'app-snack-success');
  }

  error(message: string): void {
    this.open(message, 'app-snack-error', 7000);
  }

  info(message: string): void {
    this.open(message, 'app-snack-info');
  }

  private open(message: string, panelClass: string, durationMs = 4000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: durationMs,
      panelClass: [panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
