import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { Reserva } from '../../../core/models/reserva.model';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ReservaCreateDialogComponent } from '../reserva-create-dialog/reserva-create-dialog.component';
import { ReservaDevolverDialogComponent } from '../reserva-devolver-dialog/reserva-devolver-dialog.component';

@Component({
  selector: 'app-reservas-list',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    DateFormatPipe,
    LoadingSpinnerComponent
  ],
  templateUrl: './reservas-list.component.html',
  styleUrl: './reservas-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservasListComponent implements OnInit {
  todasReservas = signal<Reserva[]>([]);
  reservasEmAtraso = signal<Reserva[]>([]);
  loading = signal(false);
  displayedColumns: string[] = ['cliente', 'livro', 'dataReserva', 'dataPrevista', 'dataDevolucao', 'status', 'acoes'];
  filtroAtivo = signal<'todas' | 'ativas' | 'atraso' | 'devolvidas'>('todas');
  searchText = signal('');
  totalReservas = computed(() => this.todasReservas().length);
  totalDevolvidas = computed(() => this.todasReservas().filter((reserva) => !!reserva.dataDevolucao).length);
  totalAtraso = computed(() => this.todasReservas().filter((reserva) => this.isAtrasada(reserva)).length);
  totalAtivas = computed(() => this.todasReservas().filter((reserva) => this.isAtiva(reserva)).length);
  filteredReservas = computed(() => {
    const filtro = this.filtroAtivo();
    const search = this.searchText().trim().toLowerCase();
    const base = this.todasReservas().filter((reserva) => {
      if (!search) {
        return true;
      }
      return (
        reserva.cliente.nome.toLowerCase().includes(search) ||
        reserva.livro.titulo.toLowerCase().includes(search)
      );
    });

    if (filtro === 'ativas') {
      return base.filter((reserva) => this.isAtiva(reserva));
    }

    if (filtro === 'atraso') {
      return base.filter((reserva) => this.isAtrasada(reserva));
    }

    if (filtro === 'devolvidas') {
      return base.filter((reserva) => !!reserva.dataDevolucao);
    }

    return base;
  });

  private reservaService = inject(ReservaService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadReservas();
  }

  loadReservas(): void {
    this.loading.set(true);
    this.reservaService.getAll().subscribe({
      next: (reservas) => {
        this.todasReservas.set(reservas);
        this.loading.set(false);
        this.loadReservasEmAtraso();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadReservasEmAtraso(): void {
    this.reservaService.getEmAtraso().subscribe({
      next: (reservas) => {
        this.reservasEmAtraso.set(reservas);
      }
    });
  }

  setFiltro(filtro: 'todas' | 'ativas' | 'atraso' | 'devolvidas'): void {
    this.filtroAtivo.set(filtro);
  }

  getStatus(reserva: Reserva): { text: string; class: string } {
    if (reserva.dataDevolucao) {
      return { text: 'Devolvido', class: 'status-devolvido' };
    }

    const hoje = new Date();
    const dataPrevista = new Date(reserva.dataPrevistaDevolucao);
    
    if (hoje > dataPrevista) {
      return { text: 'Atrasado', class: 'status-atrasado' };
    }

    return { text: 'Pendente', class: 'status-pendente' };
  }

  private isAtrasada(reserva: Reserva): boolean {
    if (reserva.dataDevolucao) {
      return false;
    }
    const hoje = new Date();
    const dataPrevista = new Date(reserva.dataPrevistaDevolucao);
    return hoje > dataPrevista;
  }

  private isAtiva(reserva: Reserva): boolean {
    return !reserva.dataDevolucao && !this.isAtrasada(reserva);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ReservaCreateDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadReservas();
      }
    });
  }

  openDevolverDialog(reserva: Reserva): void {
    const dialogRef = this.dialog.open(ReservaDevolverDialogComponent, {
      width: '500px',
      data: reserva
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadReservas();
      }
    });
  }
}
