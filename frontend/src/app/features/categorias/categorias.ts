import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Category } from '../../core/models';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../shared/notification.service';
import { CategoriesService } from './categories.service';
import { CategoryFormDialog, CategoryFormDialogData } from './category-form-dialog/category-form-dialog';

@Component({
  selector: 'app-categorias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class Categorias {
  private readonly categoriesService = inject(CategoriesService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isAdmin = computed(() => this.authService.role() === 'ADMINISTRADOR');
  protected readonly displayedColumns = computed(() =>
    this.isAdmin() ? ['name', 'description', 'actions'] : ['name', 'description'],
  );

  protected readonly dataSource = new MatTableDataSource<Category>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });
    this.load();
  }

  protected applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  protected openCreate(): void {
    this.openForm({});
  }

  protected openEdit(category: Category): void {
    this.openForm({ category });
  }

  protected confirmDelete(category: Category): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar categoría',
      message: `¿Eliminar la categoría “${category.name}”?`,
      confirmLabel: 'Eliminar',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteCategory(category);
        }
      });
  }

  private openForm(data: CategoryFormDialogData): void {
    this.dialog
      .open(CategoryFormDialog, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved?: Category) => {
        if (saved) {
          this.load();
        }
      });
  }

  private deleteCategory(category: Category): void {
    this.categoriesService
      .remove(category.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success('Categoría eliminada.');
          this.load();
        },
        // 409 si está asociada a convocatorias: el interceptor muestra el mensaje.
        error: () => {},
      });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.categoriesService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.dataSource.data = categories;
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }
}
