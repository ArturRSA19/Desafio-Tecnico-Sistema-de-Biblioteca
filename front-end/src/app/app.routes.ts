import { Routes } from '@angular/router';
import { ClientesListComponent } from './features/clientes/clientes-list/clientes-list.component';
import { LivrosListComponent } from './features/livros/livros-list/livros-list.component';
import { ReservasListComponent } from './features/reservas/reservas-list/reservas-list.component';
import { DashboardAnalyticsComponent } from './features/analytics/dashboard-analytics/dashboard-analytics.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/clientes',
    pathMatch: 'full'
  },
  {
    path: 'clientes',
    component: ClientesListComponent
  },
  {
    path: 'livros',
    component: LivrosListComponent
  },
  {
    path: 'reservas',
    component: ReservasListComponent
  },
  {
    path: 'analytics',
    component: DashboardAnalyticsComponent
  },
  {
    path: '**',
    redirectTo: '/clientes'
  }
];
