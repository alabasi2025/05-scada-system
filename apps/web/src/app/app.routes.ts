import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
      },
      { 
        path: 'stations', 
        loadComponent: () => import('./features/stations/stations-list.component').then(m => m.StationsListComponent) 
      },
      { 
        path: 'alerts', 
        loadComponent: () => import('./features/alerts/alerts-list.component').then(m => m.AlertsListComponent) 
      },
      { 
        path: 'test', 
        loadComponent: () => import('./features/test/test.component').then(m => m.TestComponent) 
      },
    ],
  },
];
