import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OrgService } from '../services/org.service';

export const orgInterceptor: HttpInterceptorFn = (req, next) => {
  const orgService = inject(OrgService);
  const activeOrgId = orgService.activeOrgId();

  if (activeOrgId) {
    const modified = req.clone({
      headers: req.headers.set('X-Active-Org', activeOrgId)
    });
    return next(modified);
  }

  return next(req);
};
