import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Category } from '../../../core/models';
import { applyServerFieldErrors } from '../../../shared/form-errors';
import { NotificationService } from '../../../shared/notification.service';
import { CategoriesService } from '../categories.service';

export interface CategoryFormDialogData {
  category?: Category;
}

@Component({
  selector: 'app-category-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './category-form-dialog.html',
  styleUrl: './category-form-dialog.scss',
})
export class CategoryFormDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<CategoryFormDialog, Category>);
  private readonly data = inject<CategoryFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEdit = !!this.data.category;
  protected readonly saving = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
  });

  constructor() {
    const existing = this.data.category;
    if (existing) {
      this.form.patchValue({ name: existing.name, description: existing.description ?? '' });
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const body = { name: raw.name, description: raw.description || undefined };
    const existing = this.data.category;
    const request$ = existing
      ? this.categoriesService.update(existing.id, body)
      : this.categoriesService.create(body);

    request$.subscribe({
      next: (saved) => {
        this.notifications.success(existing ? 'Categoría actualizada.' : 'Categoría creada.');
        this.dialogRef.close(saved);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        applyServerFieldErrors(this.form, error);
      },
    });
  }
}
