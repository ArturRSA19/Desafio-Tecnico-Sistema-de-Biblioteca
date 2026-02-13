import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { LivroService } from '../../../core/services/livro.service';
import { Livro } from '../../../core/models/livro.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LivroDialogComponent } from '../livro-dialog/livro-dialog.component';

@Component({
  selector: 'app-livros-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './livros-list.component.html',
  styleUrl: './livros-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivrosListComponent implements OnInit {
  livros = signal<Livro[]>([]);
  filteredLivros = signal<Livro[]>([]);
  loading = signal(false);
  filtroAtivo = signal<'todos' | 'disponiveis' | 'reservados'>('todos');
  searchText = signal<string>('');
  searchControl = new FormControl('', { nonNullable: true });
  totalTitulos = computed(() => this.livros().length);
  totalDisponiveis = computed(() =>
    this.livros().filter((livro) => livro.disponivel).length,
  );
  totalReservados = computed(() =>
    this.livros().filter((livro) => !livro.disponivel).length,
  );

  private livroService = inject(LivroService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private refreshTrigger$ = new Subject<void>();

  ngOnInit(): void {
    const debouncedSearch$ = this.searchControl.valueChanges.pipe(
      map((value) => value.trim()),
      debounceTime(350),
      distinctUntilChanged(),
    );

    const refresh$ = this.refreshTrigger$.pipe(
      map(() => this.searchControl.value.trim()),
    );

    merge(debouncedSearch$, refresh$)
      .pipe(
        startWith(this.searchControl.value.trim()),
        switchMap((term) => {
          this.searchText.set(term);
          this.loading.set(true);

          const request$ = this.livroService.search(term);

          return request$.pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((livros) => {
        this.livros.set(livros);
        this.applyFilter();
        this.loading.set(false);
      });
  }

  refreshLivros(): void {
    this.refreshTrigger$.next();
  }

  setFiltro(filtro: 'todos' | 'disponiveis' | 'reservados'): void {
    this.filtroAtivo.set(filtro);
    this.applyFilter();
  }

  applyFilter(): void {
    const filtro = this.filtroAtivo();
    const livros = this.livros();

    if (filtro === 'disponiveis') {
      this.filteredLivros.set(livros.filter((livro) => livro.disponivel));
    } else if (filtro === 'reservados') {
      this.filteredLivros.set(livros.filter((livro) => !livro.disponivel));
    } else {
      this.filteredLivros.set(livros);
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(LivroDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshLivros();
      }
    });
  }

  openEditDialog(livro: Livro): void {
    const dialogRef = this.dialog.open(LivroDialogComponent, {
      width: '500px',
      data: livro,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshLivros();
      }
    });
  }

  deleteLivro(livro: Livro): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir Livro',
        message: `Tem certeza que deseja excluir o livro "${livro.titulo}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.livroService.delete(livro.id).subscribe({
          next: () => {
            this.refreshLivros();
          },
        });
      }
    });
  }
}
