import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type BrandTone = 'brand' | 'on-brand';

// Marca placeholder de la USCO (reemplazable por el escudo oficial).
@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="mark"
      [class.mark--on-brand]="tone() === 'on-brand'"
      [style.--mark-size.px]="size()"
      aria-hidden="true"
    >
      <span class="mark__glyph">U</span>
    </span>
  `,
  styles: `
    .mark {
      display: inline-grid;
      place-items: center;
      inline-size: var(--mark-size, 40px);
      block-size: var(--mark-size, 40px);
      border-radius: 10px;
      background: var(--app-brand);
      color: #fff;
    }
    .mark--on-brand {
      background: transparent;
      color: #fff;
      box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.7);
    }
    .mark__glyph {
      font-family: 'Source Serif 4', Georgia, serif;
      font-weight: 700;
      font-size: calc(var(--mark-size, 40px) * 0.52);
      line-height: 1;
    }
  `,
})
export class BrandMark {
  readonly size = input(40);
  readonly tone = input<BrandTone>('brand');
}
