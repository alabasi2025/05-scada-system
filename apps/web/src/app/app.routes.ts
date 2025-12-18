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
        path: 'stations/:id', 
        loadComponent: () => import('./features/stations/station-detail.component').then(m => m.StationDetailComponent) 
      },
      { 
        path: 'devices', 
        loadComponent: () => import('./features/devices/devices-list.component').then(m => m.DevicesListComponent) 
      },
      { 
        path: 'alerts', 
        loadComponent: () => import('./features/alerts/alerts-list.component').then(m => m.AlertsListComponent) 
      },
      { 
        path: 'commands', 
        loadComponent: () => import('./features/commands/commands-list.component').then(m => m.CommandsListComponent) 
      },
      { 
        path: 'map', 
        loadComponent: () => import('./features/map/network-map.component').then(m => m.NetworkMapComponent) 
      },
      { 
        path: 'reports', 
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) 
      },
      // لوحات المراقبة المتقدمة
      { 
        path: 'quality', 
        loadComponent: () => import('./features/quality/quality-dashboard.component').then(m => m.QualityDashboardComponent) 
      },
      { 
        path: 'energy', 
        loadComponent: () => import('./features/energy/energy-dashboard.component').then(m => m.EnergyDashboardComponent) 
      },
      { 
        path: 'security', 
        loadComponent: () => import('./features/security/security-dashboard.component').then(m => m.SecurityDashboardComponent) 
      },
      { 
        path: 'test', 
        loadComponent: () => import('./features/test/test.component').then(m => m.TestComponent) 
      },
    ],
  },
];
