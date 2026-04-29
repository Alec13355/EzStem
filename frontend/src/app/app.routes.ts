import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LandingComponent } from './features/landing/landing.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () => import('./features/events/event-list/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'events/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/events/event-detail/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
