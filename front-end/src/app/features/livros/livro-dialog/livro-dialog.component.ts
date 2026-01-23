import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { LivroService } from '../../../core/services/livro.service';
import { Livro } from '../../../core/models/livro.model';

@Component({
  selector: 'app-livro-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  templateUrl: './livro-dialog.component.html',
  styleUrl: './livro-dialog.component.scss'
})
export class LivroDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<LivroDialogComponent>);
  readonly data = inject<Livro | null>(MAT_DIALOG_DATA, { optional: true });
  readonly fb = inject(FormBuilder);
  readonly livroService = inject(LivroService);

  form!: FormGroup;
  loading = signal(false);
  isEdit = false;

  ngOnInit(): void {
    this.isEdit = !!this.data;
    
    this.form = this.fb.group({
      titulo: [this.data?.titulo || '', [Validators.required, Validators.minLength(2)]],
      autor: [this.data?.autor || '', [Validators.required, Validators.minLength(2)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const dto = this.form.value;

    const request = this.isEdit
      ? this.livroService.update(this.data!.id, dto)
      : this.livroService.create(dto);

    request.subscribe({
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

  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (field.hasError('minlength')) {
      return 'Mínimo de 2 caracteres';
    }
    return '';
  }
}
