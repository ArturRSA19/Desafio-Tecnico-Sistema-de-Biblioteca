import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-mark">
            <mat-icon>menu_book</mat-icon>
          </div>
          <div class="brand-text">
            <span class="brand-title">BiblioTech</span>
            <span class="brand-subtitle">Gestão de Biblioteca</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navegação principal">
        <a routerLink="/clientes" routerLinkActive="active" class="nav-link">
          <mat-icon>group</mat-icon>
          <span>Clientes</span>
        </a>
        <a routerLink="/livros" routerLinkActive="active" class="nav-link">
          <mat-icon>menu_book</mat-icon>
          <span>Livros</span>
        </a>
        <a routerLink="/reservas" routerLinkActive="active" class="nav-link">
          <mat-icon>event_available</mat-icon>
          <span>Reservas</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      height: 100vh;
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px 20px;
      background: #184734;
      color: #e8f0ea;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-mark {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #f2c66d;
      color: #1e3d2c;
      display: grid;
      place-items: center;
      font-size: 20px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .brand-title {
      font-size: 18px;
      font-weight: 700;
      color: #fff3db;
      letter-spacing: 0.2px;
    }

    .brand-subtitle {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.78);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .nav-link mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .nav-link.active {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 1024px) {
      .sidebar {
        height: auto;
        position: relative;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }

      .sidebar-nav {
        flex-direction: row;
        flex-wrap: wrap;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {}
