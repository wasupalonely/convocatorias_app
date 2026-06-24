import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { Role, User, UserStatus } from '../../../core/models';
import { ROLE_LABELS, USER_STATUS_LABELS } from '../../../shared/labels';
import { applyServerFieldErrors } from '../../../shared/form-errors';
import { NotificationService } from '../../../shared/notification.service';
import { UsersService } from '../users.service';

export interface UserFormDialogData {
  user?: User;
}

const ROLE_OPTIONS = (['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE'] as Role[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

const STATUS_OPTIONS = (['ACTIVO', 'INACTIVO'] as UserStatus[]).map((value) => ({
  value,
  label: USER_STATUS_LABELS[value],
}));

@Component({
  selector: 'app-user-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './user-form-dialog.html',
  styleUrl: './user-form-dialog.scss',
})
export class UserFormDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialog, User>);
  private readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);

  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly isEdit = !!this.data.user;
  protected readonly saving = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    identification: ['', [Validators.required, Validators.maxLength(30)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    // En edicion la contrasena es opcional (solo se cambia si se escribe).
    password: ['', this.isEdit ? [Validators.minLength(6), Validators.maxLength(72)] : [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
    role: ['ESTUDIANTE' as Role, Validators.required],
    status: ['ACTIVO' as UserStatus, Validators.required],
  });

  constructor() {
    const existing = this.data.user;
    if (existing) {
      this.form.patchValue({
        identification: existing.identification,
        name: existing.name,
        email: existing.email,
        role: existing.role,
        status: existing.status,
      });
      // La identificacion no se edita (no forma parte de UserUpdateRequest).
      this.form.controls.identification.disable();
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const existing = this.data.user;

    const request$ = existing
      ? this.usersService.update(existing.id, {
          name: raw.name,
          email: raw.email,
          role: raw.role,
          status: raw.status,
          ...(raw.password ? { password: raw.password } : {}),
        })
      : this.usersService.create({
          identification: raw.identification,
          name: raw.name,
          email: raw.email,
          password: raw.password,
          role: raw.role,
          status: raw.status,
        });

    request$.subscribe({
      next: (saved) => {
        this.notifications.success(existing ? 'Usuario actualizado.' : 'Usuario creado.');
        this.dialogRef.close(saved);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        applyServerFieldErrors(this.form, error);
      },
    });
  }
}
