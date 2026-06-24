import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { Call, CallStatus, Category } from '../../../core/models';
import { CALL_STATUS_LABELS } from '../../../shared/labels';
import { applyServerFieldErrors } from '../../../shared/form-errors';
import { NotificationService } from '../../../shared/notification.service';
import { toIsoDate, parseIsoDate } from '../../../shared/date';
import { CategoriesService } from '../../categorias/categories.service';
import { CallsService } from '../calls.service';

export interface CallFormDialogData {
  call?: Call;
}

const STATUS_OPTIONS = (['BORRADOR', 'PUBLICADA', 'CERRADA'] as CallStatus[]).map((value) => ({
  value,
  label: CALL_STATUS_LABELS[value],
}));

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as Date | null;
  const end = group.get('endDate')?.value as Date | null;
  return start && end && end < start ? { dateRange: true } : null;
}

@Component({
  selector: 'app-call-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './call-form-dialog.html',
  styleUrl: './call-form-dialog.scss',
})
export class CallFormDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly callsService = inject(CallsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<CallFormDialog, Call>);
  private readonly data = inject<CallFormDialogData>(MAT_DIALOG_DATA);

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly categories = signal<Category[]>([]);
  protected readonly isEdit = !!this.data.call;
  protected readonly saving = signal(false);

  protected readonly form = this.formBuilder.group(
    {
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', [Validators.maxLength(500)]],
      startDate: [null as Date | null, Validators.required],
      endDate: [null as Date | null, Validators.required],
      availableSlots: [0, [Validators.required, Validators.min(0)]],
      status: ['BORRADOR' as CallStatus, Validators.required],
      categoryIds: [[] as number[]],
    },
    { validators: dateRangeValidator },
  );

  constructor() {
    this.categoriesService.list().subscribe((categories) => this.categories.set(categories));

    const existing = this.data.call;
    if (existing) {
      this.form.patchValue({
        name: existing.name,
        description: existing.description ?? '',
        startDate: parseIsoDate(existing.startDate),
        endDate: parseIsoDate(existing.endDate),
        availableSlots: existing.availableSlots,
        status: existing.status,
        categoryIds: existing.categories.map((category) => category.id),
      });
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saving.set(true);

    const body = {
      name: raw.name!,
      description: raw.description || undefined,
      startDate: toIsoDate(raw.startDate!),
      endDate: toIsoDate(raw.endDate!),
      availableSlots: raw.availableSlots!,
      status: raw.status!,
      categoryIds: raw.categoryIds ?? [],
    };

    const existing = this.data.call;
    const request$ = existing
      ? this.callsService.update(existing.id, body)
      : this.callsService.create(body);

    request$.subscribe({
      next: (saved) => {
        this.notifications.success(existing ? 'Convocatoria actualizada.' : 'Convocatoria creada.');
        this.dialogRef.close(saved);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        applyServerFieldErrors(this.form, error);
      },
    });
  }
}
