import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ride' },
  {
    path: 'ride',
    loadComponent: () => import('./features/ride/ride-page/ride-page').then((m) => m.RidePage),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history-page/history-page').then((m) => m.HistoryPage),
  },
  { path: '**', redirectTo: 'ride' },
];
