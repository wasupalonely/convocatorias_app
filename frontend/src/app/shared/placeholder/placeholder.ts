import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <section class="placeholder">
      <span class="placeholder__icon">
        <mat-icon aria-hidden="true">construction</mat-icon>
      </span>
      <h1 class="placeholder__title">{{ title }}</h1>
      <p class="placeholder__text">Este módulo estará disponible próximamente.</p>
    </section>
  `,
  styles: `
    .placeholder {
      display: grid;
      justify-items: center;
      gap: 12px;
      text-align: center;
      padding: 64px 24px;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 14px;
    }
    .placeholder__icon {
      display: grid;
      place-items: center;
      inline-size: 56px;
      block-size: 56px;
      border-radius: 14px;
      background: var(--app-brand-tint);
      color: var(--app-brand);
    }
    .placeholder__title {
      margin: 0;
      font-size: 1.6rem;
    }
    .placeholder__text {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class Placeholder {
  private readonly route = inject(ActivatedRoute);
  protected readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'Sección';
}
