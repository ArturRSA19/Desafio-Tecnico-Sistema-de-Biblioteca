import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { ReservaService } from '../../../core/services/reserva.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { LivroService } from '../../../core/services/livro.service';
import { Cliente } from '../../../core/models/cliente.model';
import { Livro } from '../../../core/models/livro.model';

class BrDateAdapter extends NativeDateAdapter {
  override format(date: Date): string {
    const day = this._to2digit(date.getDate());
    const month = this._to2digit(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  override parse(value: string | number): Date | null {
    if (typeof value === 'number') {
      return new Date(value);
    }

    if (typeof value === 'string') {
      const parts = value.split('/').map((part) => Number(part));
      if (parts.length === 3) {
        const [day, month, year] = parts;
        if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
          return new Date(year, month - 1, day);
        }
      }
    }

    return null;
  }

  private _to2digit(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
}

@Component({
  selector: 'app-reserva-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './reserva-create-dialog.component.html',
  styleUrl: './reserva-create-dialog.component.scss',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: DateAdapter, useClass: BrDateAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'dd/MM/yyyy'
        },
        display: {
          dateInput: 'dd/MM/yyyy',
          monthYearLabel: 'MMM yyyy',
          dateA11yLabel: 'dd/MM/yyyy',
          monthYearA11yLabel: 'MMMM yyyy'
        }
      }
    }
  ]
})
export class ReservaCreateDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<ReservaCreateDialogComponent>);
  readonly fb = inject(FormBuilder);
  readonly reservaService = inject(ReservaService);
  readonly clienteService = inject(ClienteService);
  readonly livroService = inject(LivroService);

  form!: FormGroup;
  loading = signal(false);
  clientes = signal<Cliente[]>([]);
  livrosDisponiveis = signal<Livro[]>([]);
  minDate = new Date();

  ngOnInit(): void {
    this.form = this.fb.group({
      clienteId: ['', Validators.required],
      livroId: ['', Validators.required],
      dataReserva: [new Date(), Validators.required],
      dataPrevistaDevolucao: ['', Validators.required]
    });

    this.loadClientes();
    this.loadLivrosDisponiveis();
  }

  loadClientes(): void {
    this.clienteService.getAll().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
      }
    });
  }

  loadLivrosDisponiveis(): void {
    this.livroService.getAll(true).subscribe({
      next: (livros) => {
        this.livrosDisponiveis.set(livros);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validação de datas
    const dataReserva = new Date(this.form.value.dataReserva);
    const dataPrevista = new Date(this.form.value.dataPrevistaDevolucao);

    if (dataPrevista <= dataReserva) {
      alert('A data prevista de devolução deve ser posterior à data da reserva');
      return;
    }

    this.loading.set(true);
    
    const dto = {
      clienteId: this.form.value.clienteId,
      livroId: this.form.value.livroId,
      dataReserva: new Date(this.form.value.dataReserva).toISOString(),
      dataPrevistaDevolucao: new Date(this.form.value.dataPrevistaDevolucao).toISOString()
    };

    this.reservaService.create(dto).subscribe({
      next: () => {
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
