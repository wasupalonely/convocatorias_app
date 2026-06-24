import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Application, ApplicationStatus } from '../../../core/models';
import { NotificationService } from '../../../shared/notification.service';
import { ApplicationsService } from '../applications.service';

export interface ApplicationStatusDialogData {
  application: Application;
  targetStatus: Extract<ApplicationStatus, 'APROBADA' | 'RECHAZADA'>;
}

@Component({
  selector: 'app-application-status-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './application-status-dialog.html',
  styleUrl: './application-status-dialog.scss',
})
export class ApplicationStatusDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<ApplicationStatusDialog, Application>);
  protected readonly data = inject<ApplicationStatusDialogData>(MAT_DIALOG_DATA);

  protected readonly isApprove = this.data.targetStatus === 'APROBADA';
  protected readonly saving = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    observation: ['', [Validators.maxLength(500)]],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const observation = this.form.getRawValue().observation;
    this.applicationsService
      .changeStatus(this.data.application.id, {
        status: this.data.targetStatus,
        observation: observation || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.notifications.success(this.isApprove ? 'Postulación aprobada.' : 'Postulación rechazada.');
          this.dialogRef.close(updated);
        },
        // 409 (p. ej. sin cupos al aprobar): el interceptor muestra el mensaje.
        error: () => this.saving.set(false),
      });
  }
}
