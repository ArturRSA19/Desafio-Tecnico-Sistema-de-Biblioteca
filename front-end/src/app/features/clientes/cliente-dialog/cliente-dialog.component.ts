import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';
import { cpfValidator } from '../../../shared/validators/cpf.validator';
import { CpfMaskDirective } from '../../../shared/directives/cpf-mask.directive';

@Component({
  selector: 'app-cliente-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    CpfMaskDirective
  ],
  templateUrl: './cliente-dialog.component.html',
  styleUrl: './cliente-dialog.component.scss'
})
export class ClienteDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<ClienteDialogComponent>);
  readonly data = inject<Cliente | null>(MAT_DIALOG_DATA, { optional: true });
  readonly fb = inject(FormBuilder);
  readonly clienteService = inject(ClienteService);
  readonly snackBar = inject(MatSnackBar);

  form!: FormGroup;
  loading = signal(false);
  isEdit = false;

  ngOnInit(): void {
    this.isEdit = !!this.data;
    
    this.form = this.fb.group({
      nome: [this.data?.nome || '', [Validators.required, Validators.minLength(3)]],
      cpf: [this.data?.cpf || '', [Validators.required, cpfValidator()]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;

    // Remove formatação do CPF antes de enviar
    const dto = {
      ...formValue,
      cpf: formValue.cpf.replace(/\D/g, '')
    };

    const request = this.isEdit
      ? this.clienteService.update(this.data!.id, dto)
      : this.clienteService.create(dto);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(
          this.isEdit ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!',
          'Fechar',
          {
            duration: 3500,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          }
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading.set(false);
        const errorMessage = error?.error?.message || 
          (this.isEdit ? 'Erro ao atualizar cliente. Tente novamente.' : 'Erro ao cadastrar cliente. Tente novamente.');
        
        this.snackBar.open(
          errorMessage,
          'Fechar',
          {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
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
      return 'Mínimo de 3 caracteres';
    }
    if (field.hasError('cpfInvalido')) {
      return 'CPF inválido';
    }
    return '';
  }
}
