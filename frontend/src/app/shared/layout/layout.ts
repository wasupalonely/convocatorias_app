import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { Role } from '../../core/models';
import { AuthService } from '../../core/auth/auth.service';
import { ROLE_LABELS } from '../labels';
import { BrandMark } from '../brand-mark';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Role[];
}

const ALL_ROLES: Role[] = ['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE'];

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: 'home', route: '/inicio', roles: ALL_ROLES },
  { label: 'Usuarios', icon: 'group', route: '/usuarios', roles: ['ADMINISTRADOR'] },
  { label: 'Convocatorias', icon: 'campaign', route: '/convocatorias', roles: ALL_ROLES },
  { label: 'Categorías', icon: 'sell', route: '/categorias', roles: ALL_ROLES },
  { label: 'Postulaciones', icon: 'how_to_reg', route: '/postulaciones', roles: ALL_ROLES },
  { label: 'Reportes', icon: 'insights', route: '/reportes', roles: ['ADMINISTRADOR'] },
];

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    BrandMark,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly authService = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly user = this.authService.currentUser;

  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  protected readonly navItems = computed(() => {
    const role = this.user()?.role;
    return role ? NAV_ITEMS.filter((item) => item.roles.includes(role)) : [];
  });

  protected logout(): void {
    this.authService.logout();
  }
}
