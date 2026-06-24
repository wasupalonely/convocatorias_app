import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '../models';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.role();
  if (!role) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data['roles'] as Role[] | undefined;
  if (!allowedRoles || allowedRoles.includes(role)) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};
