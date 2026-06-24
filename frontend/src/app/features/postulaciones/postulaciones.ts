import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Application, ApplicationStatus } from '../../core/models';
import { AuthService } from '../../core/auth/auth.service';
import { APPLICATION_STATUS_LABELS } from '../../shared/labels';
import { ChipTone, StatusChip } from '../../shared/status-chip';
import { NotificationService } from '../../shared/notification.service';
import { ApplicationsService } from './applications.service';
import { ApplicationCreateDialog } from './application-create-dialog/application-create-dialog';
import { ApplicationStatusDialog, ApplicationStatusDialogData } from './application-status-dialog/application-status-dialog';

type StatusFilter = ApplicationStatus | 'TODAS';

const STATUS_TONES: Record<ApplicationStatus, ChipTone> = {
  PENDIENTE: 'warning',
  APROBADA: 'success',
  RECHAZADA: 'danger',
};

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'TODAS', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: APPLICATION_STATUS_LABELS.PENDIENTE },
  { value: 'APROBADA', label: APPLICATION_STATUS_LABELS.APROBADA },
  { value: 'RECHAZADA', label: APPLICATION_STATUS_LABELS.RECHAZADA },
];

@Component({
  selector: 'app-postulaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    StatusChip,
  ],
  templateUrl: './postulaciones.html',
  styleUrl: './postulaciones.scss',
})
export class Postulaciones {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isAdmin = computed(() => this.authService.role() === 'ADMINISTRADOR');
  protected readonly statusFilterOptions = STATUS_FILTER_OPTIONS;

  protected readonly displayedColumns = computed(() =>
    this.isAdmin()
      ? ['call', 'applicant', 'status', 'appliedAt', 'actions']
      : ['call', 'status', 'observation', 'appliedAt'],
  );

  protected readonly dataSource = new MatTableDataSource<Application>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  private readonly allApplications = signal<Application[]>([]);
  private readonly searchTerm = signal('');
  protected readonly statusFilter = signal<StatusFilter>('TODAS');

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });
    effect(() => {
      this.dataSource.data = this.filterApplications();
    });
    this.load();
  }

  protected statusLabel(status: ApplicationStatus): string {
    return APPLICATION_STATUS_LABELS[status];
  }

  protected statusTone(status: ApplicationStatus): ChipTone {
    return STATUS_TONES[status];
  }

  protected setSearch(value: string): void {
    this.searchTerm.set(value.trim().toLowerCase());
  }

  protected setStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected openCreate(): void {
    const appliedCallIds = this.allApplications().map((application) => application.callId);
    this.dialog
      .open(ApplicationCreateDialog, { data: { appliedCallIds } })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved?: Application) => {
        if (saved) {
          this.load();
        }
      });
  }

  protected decide(application: Application, targetStatus: ApplicationStatusDialogData['targetStatus']): void {
    this.dialog
      .open(ApplicationStatusDialog, { data: { application, targetStatus } })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated?: Application) => {
        if (updated) {
          this.load();
        }
      });
  }

  private filterApplications(): Application[] {
    const term = this.searchTerm();
    const status = this.statusFilter();
    return this.allApplications().filter((application) => {
      const matchesStatus = status === 'TODAS' || application.status === status;
      const matchesTerm =
        term === '' ||
        `${application.callName} ${application.applicantName} ${application.applicantEmail}`
          .toLowerCase()
          .includes(term);
      return matchesStatus && matchesTerm;
    });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.applicationsService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (applications) => {
          this.allApplications.set(applications);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }
}
