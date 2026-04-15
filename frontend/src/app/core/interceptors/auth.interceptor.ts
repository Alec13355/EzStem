import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  return from(authService.getToken()).pipe(
    switchMap(token => {
      if (token) {
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
      }
      return next(req);
    })
  );
};
