import { ChangeDetectionStrategy, Component, effect, inject, signal, viewChild } from '@angular/core';
import { DestroyRef } from '@angular/core';
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

import { User, UserStatus } from '../../core/models';
import { ROLE_LABELS, USER_STATUS_LABELS } from '../../shared/labels';
import { ChipTone, StatusChip } from '../../shared/status-chip';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../shared/notification.service';
import { UsersService } from './users.service';
import { UserFormDialog, UserFormDialogData } from './user-form-dialog/user-form-dialog';

@Component({
  selector: 'app-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    StatusChip,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly displayedColumns = ['identification', 'name', 'email', 'role', 'status', 'actions'];
  protected readonly dataSource = new MatTableDataSource<User>([]);
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

  protected roleLabel(user: User): string {
    return ROLE_LABELS[user.role];
  }

  protected statusLabel(status: UserStatus): string {
    return USER_STATUS_LABELS[status];
  }

  protected statusTone(status: UserStatus): ChipTone {
    return status === 'ACTIVO' ? 'success' : 'neutral';
  }

  protected applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  protected openCreate(): void {
    this.openForm({});
  }

  protected openEdit(user: User): void {
    this.openForm({ user });
  }

  protected confirmDelete(user: User): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar usuario',
      message: `¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteUser(user);
        }
      });
  }

  private openForm(data: UserFormDialogData): void {
    this.dialog
      .open(UserFormDialog, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved?: User) => {
        if (saved) {
          this.load();
        }
      });
  }

  private deleteUser(user: User): void {
    this.usersService
      .remove(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success('Usuario eliminado.');
          this.load();
        },
        // Los errores (p. ej. 409 por postulaciones asociadas) los muestra el interceptor.
        error: () => {},
      });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.usersService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.dataSource.data = users;
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }
}
