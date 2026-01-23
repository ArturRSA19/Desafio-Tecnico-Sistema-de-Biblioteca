import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReservaService } from '../../../core/services/reserva.service';
import { Reserva } from '../../../core/models/reserva.model';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-reserva-devolver-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DateFormatPipe
  ],
  templateUrl: './reserva-devolver-dialog.component.html',
  styleUrl: './reserva-devolver-dialog.component.scss'
})
export class ReservaDevolverDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<ReservaDevolverDialogComponent>);
  readonly data = inject<Reserva>(MAT_DIALOG_DATA);
  readonly reservaService = inject(ReservaService);

  loading = signal(false);
  hoje = new Date();
  hojeStr = this.hoje.toISOString();
  multaInfo = signal<{ multa: number; dias: number } | null>(null);

  ngOnInit(): void {
    this.calcularMulta();
  }

  calcularMulta(): void {
    const dataPrevista = new Date(this.data.dataPrevistaDevolucao);
    const info = this.reservaService.calcularMulta(dataPrevista, this.hoje);
    this.multaInfo.set(info);
  }

  onConfirm(): void {
    this.loading.set(true);
    this.reservaService.devolver(this.data.id).subscribe({
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
