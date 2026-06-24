import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { Application, Call } from '../../../core/models';
import { NotificationService } from '../../../shared/notification.service';
import { CallsService } from '../../convocatorias/calls.service';
import { ApplicationsService } from '../applications.service';

export interface ApplicationCreateDialogData {
  appliedCallIds: number[];
}

@Component({
  selector: 'app-application-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './application-create-dialog.html',
  styleUrl: './application-create-dialog.scss',
})
export class ApplicationCreateDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly callsService = inject(CallsService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<ApplicationCreateDialog, Application>);
  private readonly data = inject<ApplicationCreateDialogData>(MAT_DIALOG_DATA);

  protected readonly availableCalls = signal<Call[]>([]);
  protected readonly loadingCalls = signal(true);
  protected readonly saving = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    callId: [null as number | null, Validators.required],
  });

  constructor() {
    this.callsService.list().subscribe({
      next: (calls) => {
        const applied = new Set(this.data.appliedCallIds);
        // Solo convocatorias publicadas a las que aun no se ha postulado.
        this.availableCalls.set(calls.filter((call) => call.status === 'PUBLICADA' && !applied.has(call.id)));
        this.loadingCalls.set(false);
      },
      error: () => this.loadingCalls.set(false),
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.applicationsService.create({ callId: this.form.getRawValue().callId! }).subscribe({
      next: (saved) => {
        this.notifications.success('Postulación registrada.');
        this.dialogRef.close(saved);
      },
      // Si el backend rechaza (cupos llenos, etc.) el interceptor muestra el mensaje.
      error: () => this.saving.set(false),
    });
  }
}
