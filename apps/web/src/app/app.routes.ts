import { Route } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout';

export const appRoutes: Route[] = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/advanced-dashboard').then(m => m.AdvancedDashboardComponent)
      },
      {
        path: 'map',
        loadComponent: () => import('./features/map/stations-map').then(m => m.StationsMapComponent)
      },
      {
        path: 'charts',
        loadComponent: () => import('./features/charts/live-charts').then(m => m.LiveChartsComponent)
      },
      {
        path: 'stations',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/stations/stations-list').then(m => m.StationsListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/stations/station-detail').then(m => m.StationDetailComponent)
          }
        ]
      },
      {
        path: 'devices',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/devices/devices-list').then(m => m.DevicesListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/devices/device-detail').then(m => m.DeviceDetailComponent)
          }
        ]
      },
      {
        path: 'alarms',
        loadComponent: () => import('./features/alarms/alarms-list').then(m => m.AlarmsListComponent)
      },
      {
        path: 'commands',
        loadComponent: () => import('./features/commands/commands-list').then(m => m.CommandsListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then(m => m.ReportsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
