import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
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

import { ApplicationStatus, Call, CallStatus, Category } from '../../core/models';
import { AuthService } from '../../core/auth/auth.service';
import { APPLICATION_STATUS_LABELS, CALL_STATUS_LABELS } from '../../shared/labels';
import { ChipTone, StatusChip } from '../../shared/status-chip';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../shared/notification.service';
import { parseIsoDate } from '../../shared/date';
import { CategoriesService } from '../categorias/categories.service';
import { ApplicationsService } from '../postulaciones/applications.service';
import { CallsService } from './calls.service';
import { CallFormDialog, CallFormDialogData } from './call-form-dialog/call-form-dialog';

const STATUS_TONES: Record<CallStatus, ChipTone> = {
  BORRADOR: 'neutral',
  PUBLICADA: 'success',
  CERRADA: 'danger',
};

const APPLICATION_STATUS_TONES: Record<ApplicationStatus, ChipTone> = {
  PENDIENTE: 'warning',
  APROBADA: 'success',
  RECHAZADA: 'danger',
};

@Component({
  selector: 'app-convocatorias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
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
  templateUrl: './convocatorias.html',
  styleUrl: './convocatorias.scss',
})
export class Convocatorias {
  private readonly callsService = inject(CallsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isAdmin = computed(() => this.authService.role() === 'ADMINISTRADOR');
  // Solo ESTUDIANTE y DOCENTE pueden postularse (el backend es la fuente de verdad).
  protected readonly canApply = computed(() => {
    const role = this.authService.role();
    return role === 'ESTUDIANTE' || role === 'DOCENTE';
  });
  protected readonly displayedColumns = computed(() => {
    const columns = ['name', 'status', 'dates', 'availableSlots', 'categories'];
    if (this.isAdmin()) {
      return [...columns, 'actions'];
    }
    return this.canApply() ? [...columns, 'apply'] : columns;
  });

  // callId -> estado de mi postulación, para mostrar el estado en vez del botón si ya me postulé.
  protected readonly myApplications = signal<Map<number, ApplicationStatus>>(new Map());

  protected readonly categories = signal<Category[]>([]);
  protected readonly dataSource = new MatTableDataSource<Call>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  private readonly allCalls = signal<Call[]>([]);
  private readonly searchTerm = signal('');
  protected readonly categoryFilter = signal<number | 'TODAS'>('TODAS');

  protected readonly dateForm = this.formBuilder.group({
    from: [null as Date | null],
    to: [null as Date | null],
  });
  private readonly dateRange = toSignal(this.dateForm.valueChanges, { initialValue: this.dateForm.getRawValue() });

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    const categoryParam = this.route.snapshot.queryParamMap.get('categoria');
    if (categoryParam) {
      this.categoryFilter.set(Number(categoryParam));
    }

    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });
    effect(() => {
      this.dataSource.data = this.filterCalls();
    });

    this.categoriesService.list().subscribe((categories) => this.categories.set(categories));
    this.load();
    if (this.canApply()) {
      this.loadMyApplications();
    }
  }

  protected myApplicationStatus(call: Call): ApplicationStatus | null {
    return this.myApplications().get(call.id) ?? null;
  }

  protected applicationStatusLabel(status: ApplicationStatus): string {
    return APPLICATION_STATUS_LABELS[status];
  }

  protected applicationStatusTone(status: ApplicationStatus): ChipTone {
    return APPLICATION_STATUS_TONES[status];
  }

  // Se puede postular mientras la convocatoria esté PUBLICADA, queden cupos por asignar
  // (aprobadas < total) y aún no me haya postulado. El cupo se consume al aprobar.
  protected canApplyTo(call: Call): boolean {
    return (
      call.status === 'PUBLICADA' &&
      call.approvedCount < call.availableSlots &&
      !this.myApplications().has(call.id)
    );
  }

  protected slotsAreFull(call: Call): boolean {
    return call.approvedCount >= call.availableSlots;
  }

  protected apply(call: Call): void {
    const data: ConfirmDialogData = {
      title: 'Confirmar postulación',
      message: `¿Deseas postularte a la convocatoria “${call.name}”?`,
      confirmLabel: 'Postularme',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.submitApplication(call);
        }
      });
  }

  private submitApplication(call: Call): void {
    this.applicationsService
      .create({ callId: call.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success('Postulación registrada.');
          this.loadMyApplications();
        },
        // 409 (sin cupos, ya postulado, no publicada): el interceptor muestra el mensaje.
        error: () => {},
      });
  }

  private loadMyApplications(): void {
    this.applicationsService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (applications) => {
          this.myApplications.set(new Map(applications.map((app) => [app.callId, app.status])));
        },
        error: () => {},
      });
  }

  protected statusLabel(status: CallStatus): string {
    return CALL_STATUS_LABELS[status];
  }

  protected statusTone(status: CallStatus): ChipTone {
    return STATUS_TONES[status];
  }

  protected setSearch(value: string): void {
    this.searchTerm.set(value.trim().toLowerCase());
  }

  protected readonly activeCategoryName = computed(() => {
    const value = this.categoryFilter();
    if (value === 'TODAS') {
      return null;
    }
    return this.categories().find((category) => category.id === value)?.name ?? null;
  });

  protected setCategoryFilter(value: number | 'TODAS'): void {
    this.categoryFilter.set(value);
  }

  protected clearCategoryFilter(): void {
    this.categoryFilter.set('TODAS');
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('TODAS');
    this.dateForm.reset();
  }

  protected openCreate(): void {
    this.openForm({});
  }

  protected openEdit(call: Call): void {
    this.openForm({ call });
  }

  protected confirmDelete(call: Call): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar convocatoria',
      message: `¿Eliminar la convocatoria “${call.name}”?`,
      confirmLabel: 'Eliminar',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteCall(call);
        }
      });
  }

  private filterCalls(): Call[] {
    const term = this.searchTerm();
    const category = this.categoryFilter();
    const { from, to } = this.dateRange();

    return this.allCalls().filter((call) => {
      const matchesTerm =
        term === '' || `${call.name} ${call.description ?? ''}`.toLowerCase().includes(term);
      const matchesCategory =
        category === 'TODAS' || call.categories.some((categoryItem) => categoryItem.id === category);
      // Vigencia (inicio-fin) que cruza el rango: inicio <= to AND fin >= from.
      const matchesFrom = !from || parseIsoDate(call.endDate) >= from;
      const matchesTo = !to || parseIsoDate(call.startDate) <= to;
      return matchesTerm && matchesCategory && matchesFrom && matchesTo;
    });
  }

  private openForm(data: CallFormDialogData): void {
    this.dialog
      .open(CallFormDialog, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved?: Call) => {
        if (saved) {
          this.load();
        }
      });
  }

  private deleteCall(call: Call): void {
    this.callsService
      .remove(call.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success('Convocatoria eliminada.');
          this.load();
        },
        // 409 si tiene postulaciones asociadas: el interceptor muestra el mensaje.
        error: () => {},
      });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.callsService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (calls) => {
          this.allCalls.set(calls);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }
}
