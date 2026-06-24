import { ChangeDetectionStrategy, Component, DestroyRef, WritableSignal, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

import { ReportItem } from '../../core/models';
import { toIsoDate } from '../../shared/date';
import { ReportDateRange, ReportsService } from './reports.service';
import { ReportSection } from './report-section/report-section';

interface ReportState {
  readonly items: WritableSignal<ReportItem[]>;
  readonly loading: WritableSignal<boolean>;
  readonly error: WritableSignal<boolean>;
}

@Component({
  selector: 'app-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    ReportSection,
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes {
  private readonly reportsService = inject(ReportsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly callsByCategory = this.createState();
  protected readonly applicationsByCall = this.createState();
  protected readonly applicationsByResult = this.createState();

  protected readonly rangeForm = this.formBuilder.group({
    from: [null as Date | null],
    to: [null as Date | null],
  });

  constructor() {
    this.reload();
  }

  protected applyRange(): void {
    this.reload();
  }

  protected clearRange(): void {
    this.rangeForm.reset();
    this.reload();
  }

  private reload(): void {
    const { from, to } = this.rangeForm.getRawValue();
    const range: ReportDateRange = {
      from: from ? toIsoDate(from) : undefined,
      to: to ? toIsoDate(to) : undefined,
    };
    this.load(this.reportsService.callsByCategory(range), this.callsByCategory);
    this.load(this.reportsService.applicationsByCall(range), this.applicationsByCall);
    this.load(this.reportsService.applicationsByResult(range), this.applicationsByResult);
  }

  private createState(): ReportState {
    return {
      items: signal<ReportItem[]>([]),
      loading: signal(true),
      error: signal(false),
    };
  }

  private load(source$: Observable<ReportItem[]>, state: ReportState): void {
    state.loading.set(true);
    state.error.set(false);
    source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        state.items.set(items);
        state.loading.set(false);
      },
      error: () => {
        state.loading.set(false);
        state.error.set(true);
      },
    });
  }
}
