import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, from, switchMap, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (!authService.isAuthenticated()) {
    return next(req);
  }

  return from(authService.getToken()).pipe(
    catchError(() => of(null)),
    switchMap(token => {
      if (token) {
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
      }
      // Authenticated but no token — MSAL redirect is in flight; suppress request silently.
      return EMPTY;
    })
  );
};
