import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LandingComponent } from './features/landing/landing.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'items',
    canActivate: [authGuard],
    loadComponent: () => import('./features/item-library/item-list/item-list.component').then(m => m.ItemListComponent)
  },
  {
    path: 'vendors',
    canActivate: [authGuard],
    loadComponent: () => import('./features/item-library/vendor-list/vendor-list.component').then(m => m.VendorListComponent)
  },
  {
    path: 'recipes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/recipes/recipe-list/recipe-list.component').then(m => m.RecipeListComponent)
  },
  {
    path: 'recipes/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/recipes/recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent)
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
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/order-list/order-list.component').then(m => m.OrderListComponent)
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
  },
  {
    path: 'settings/pricing',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pricing/pricing-settings/pricing-settings.component').then(m => m.PricingSettingsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
