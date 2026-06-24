import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { ReportItem } from '../../../core/models';
import { exportToPdf, exportToXlsx } from '../../../shared/export';

type ReportChartType = 'bar' | 'doughnut';

const BRAND = '#87241d';
const SLICE_PALETTE = ['#87241d', '#2e7d32', '#9a6700', '#1f6f78', '#6a5b59', '#c0563f', '#4b3634'];

@Component({
  selector: 'app-report-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective, MatButtonModule, MatIconModule, MatProgressBarModule, MatTableModule],
  templateUrl: './report-section.html',
  styleUrl: './report-section.scss',
})
export class ReportSection {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly labelHeader = input.required<string>();
  readonly filenameBase = input.required<string>();
  readonly items = input.required<ReportItem[]>();
  readonly loading = input(false);
  readonly error = input(false);
  readonly chartType = input<ReportChartType>('bar');

  protected readonly displayedColumns = ['label', 'total'];

  protected readonly chartData = computed<ChartConfiguration['data']>(() => {
    const items = this.items();
    const isDoughnut = this.chartType() === 'doughnut';
    return {
      labels: items.map((item) => item.label),
      datasets: [
        {
          data: items.map((item) => item.total),
          label: this.title(),
          backgroundColor: isDoughnut ? items.map((_, index) => SLICE_PALETTE[index % SLICE_PALETTE.length]) : BRAND,
          borderColor: isDoughnut ? '#fff' : BRAND,
          borderWidth: isDoughnut ? 2 : 0,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration['options']>(() => {
    const isDoughnut = this.chartType() === 'doughnut';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: isDoughnut, position: 'bottom' } },
      scales: isDoughnut ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } } },
    };
  });

  private readonly rows = computed<(string | number)[][]>(() =>
    this.items().map((item) => [item.label, item.total]),
  );

  protected exportXlsx(): void {
    exportToXlsx(this.filenameBase(), [this.labelHeader(), 'Total'], this.rows());
  }

  protected exportPdf(): void {
    exportToPdf(this.title(), this.filenameBase(), [this.labelHeader(), 'Total'], this.rows());
  }
}
