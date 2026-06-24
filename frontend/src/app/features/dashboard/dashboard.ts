import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Role } from '../../core/models';
import { AuthService } from '../../core/auth/auth.service';
import { ROLE_LABELS } from '../../shared/labels';

interface DashboardCard {
  title: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.currentUser;
  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  protected readonly cards = computed<DashboardCard[]>(() => {
    const role = this.user()?.role;
    return role ? buildCards(role) : [];
  });
}

function buildCards(role: Role): DashboardCard[] {
  const isAdmin = role === 'ADMINISTRADOR';
  const cards: DashboardCard[] = [];

  if (isAdmin) {
    cards.push({
      title: 'Usuarios',
      description: 'Gestiona las cuentas, roles y estados del sistema.',
      icon: 'group',
      route: '/usuarios',
    });
  }

  cards.push({
    title: 'Convocatorias',
    description: isAdmin
      ? 'Crea, publica y administra las convocatorias.'
      : 'Explora las convocatorias disponibles.',
    icon: 'campaign',
    route: '/convocatorias',
  });

  cards.push({
    title: 'Categorías',
    description: 'Áreas temáticas que clasifican las convocatorias.',
    icon: 'sell',
    route: '/categorias',
  });

  cards.push({
    title: 'Postulaciones',
    description: isAdmin
      ? 'Revisa, aprueba o rechaza las postulaciones recibidas.'
      : 'Postúlate y haz seguimiento al estado de tus postulaciones.',
    icon: 'how_to_reg',
    route: '/postulaciones',
  });

  if (isAdmin) {
    cards.push({
      title: 'Reportes',
      description: 'Indicadores del sistema en tabla y gráfico.',
      icon: 'insights',
      route: '/reportes',
    });
  }

  return cards;
}
