import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { LivroService } from '../../../core/services/livro.service';
import { Livro } from '../../../core/models/livro.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LivroDialogComponent } from '../livro-dialog/livro-dialog.component';

@Component({
  selector: 'app-livros-list',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './livros-list.component.html',
  styleUrl: './livros-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LivrosListComponent implements OnInit {
  livros = signal<Livro[]>([]);
  filteredLivros = signal<Livro[]>([]);
  loading = signal(false);
  filtroAtivo = signal<'todos' | 'disponiveis' | 'reservados'>('todos');
  searchText = signal('');
  totalTitulos = computed(() => this.livros().length);
  totalDisponiveis = computed(() => this.livros().filter((livro) => livro.disponivel).length);
  totalReservados = computed(() => this.livros().filter((livro) => !livro.disponivel).length);

  private livroService = inject(LivroService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadLivros();
  }

  loadLivros(): void {
    this.loading.set(true);
    this.livroService.getAll().subscribe({
      next: (livros) => {
        this.livros.set(livros);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setFiltro(filtro: 'todos' | 'disponiveis' | 'reservados'): void {
    this.filtroAtivo.set(filtro);
    this.applyFilter();
  }

  applyFilter(): void {
    const filtro = this.filtroAtivo();
    const livros = this.livros();
    const search = this.searchText().trim().toLowerCase();
    const filtered = livros.filter((livro) => {
      if (!search) {
        return true;
      }
      return (
        livro.titulo.toLowerCase().includes(search) ||
        livro.autor.toLowerCase().includes(search)
      );
    });

    if (filtro === 'disponiveis') {
      this.filteredLivros.set(filtered.filter(l => l.disponivel));
    } else if (filtro === 'reservados') {
      this.filteredLivros.set(filtered.filter(l => !l.disponivel));
    } else {
      this.filteredLivros.set(filtered);
    }
  }

  onSearch(): void {
    this.applyFilter();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(LivroDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadLivros();
      }
    });
  }

  openEditDialog(livro: Livro): void {
    const dialogRef = this.dialog.open(LivroDialogComponent, {
      width: '500px',
      data: livro
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadLivros();
      }
    });
  }

  deleteLivro(livro: Livro): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir Livro',
        message: `Tem certeza que deseja excluir o livro "${livro.titulo}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.livroService.delete(livro.id).subscribe({
          next: () => {
            this.loadLivros();
          }
        });
      }
    });
  }
}
