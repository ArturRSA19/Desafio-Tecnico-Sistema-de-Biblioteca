import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ClienteDialogComponent } from '../cliente-dialog/cliente-dialog.component';

@Component({
  selector: 'app-clientes-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    FormsModule,
    CpfFormatPipe,
    LoadingSpinnerComponent
  ],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientesListComponent implements OnInit {
  clientes = signal<Cliente[]>([]);
  filteredClientes = signal<Cliente[]>([]);
  loading = signal(false);
  searchText = signal('');
  displayedColumns: string[] = ['nome', 'cpf', 'acoes'];
  totalClientes = computed(() => this.clientes().length);

  private clienteService = inject(ClienteService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    this.clienteService.getAll().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.filteredClientes.set(clientes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    const rawSearch = this.searchText().trim();
    if (!rawSearch) {
      this.filteredClientes.set(this.clientes());
      return;
    }

    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    const search = normalize(rawSearch);
    const cpfSearch = rawSearch.replace(/\D/g, '');

    const filtered = this.clientes().filter(cliente => {
      const nomeMatch = normalize(cliente.nome).includes(search);
      const cpfMatch = cpfSearch.length > 0 && cliente.cpf.includes(cpfSearch);
      return nomeMatch || cpfMatch;
    });
    this.filteredClientes.set(filtered);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ClienteDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClientes();
      }
    });
  }

  openEditDialog(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ClienteDialogComponent, {
      width: '500px',
      data: cliente
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClientes();
      }
    });
  }

  deleteCliente(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir Cliente',
        message: `Tem certeza que deseja excluir o cliente ${cliente.nome}?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.clienteService.delete(cliente.id).subscribe({
          next: () => {
            this.loadClientes();
          }
        });
      }
    });
  }
}
