import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'items',
    pathMatch: 'full'
  },
  {
    path: 'items',
    loadComponent: () => import('./features/item-library/item-list/item-list.component').then(m => m.ItemListComponent)
  },
  {
    path: 'vendors',
    loadComponent: () => import('./features/item-library/vendor-list/vendor-list.component').then(m => m.VendorListComponent)
  },
  {
    path: 'recipes',
    loadComponent: () => import('./features/recipes/recipe-list/recipe-list.component').then(m => m.RecipeListComponent)
  },
  {
    path: 'recipes/:id',
    loadComponent: () => import('./features/recipes/recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./features/events/event-list/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/events/event-detail/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/order-list/order-list.component').then(m => m.OrderListComponent)
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
  },
  {
    path: '**',
    redirectTo: 'items'
  }
];
