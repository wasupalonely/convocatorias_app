import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip" [class]="'chip--' + tone()">{{ label() }}</span>`,
  styles: `
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.6;
      white-space: nowrap;
    }
    .chip--neutral {
      background: color-mix(in srgb, #6a5b59 14%, transparent);
      color: #5e4f4d;
    }
    .chip--success {
      background: color-mix(in srgb, #2e7d32 14%, transparent);
      color: #2e7d32;
    }
    .chip--warning {
      background: color-mix(in srgb, #9a6700 16%, transparent);
      color: #845600;
    }
    .chip--danger {
      background: color-mix(in srgb, #c62828 14%, transparent);
      color: #c62828;
    }
    .chip--brand {
      background: var(--app-brand-tint);
      color: var(--app-brand);
    }
  `,
})
export class StatusChip {
  readonly label = input.required<string>();
  readonly tone = input<ChipTone>('neutral');
}
