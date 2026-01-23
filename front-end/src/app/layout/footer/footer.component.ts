import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <footer class="professional-footer">
      <div class="footer-content">
        <p>© 2026 Sistema de Biblioteca Digital. Todos os direitos reservados.</p>
      </div>
    </footer>
  `,
  styles: [`
    .professional-footer {
      background: #0f172a;
      border-top: 1px solid #1e293b;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px 32px;
      text-align: center;
    }

    p {
      margin: 0;
      color: #64748b;
      font-size: 13px;
      font-weight: 400;
    }

    @media (max-width: 768px) {
      .footer-content {
        padding: 16px;
      }

      p {
        font-size: 12px;
      }
    }
  `]
})
export class FooterComponent {}
