import { Component, DestroyRef, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LivroService } from '../../../core/services/livro.service';
import { VoiceRecognitionService } from '../../../core/services/voice-recognition.service';
import { Livro } from '../../../core/models/livro.model';

const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.8;

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
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './livro-dialog.component.html',
  styleUrl: './livro-dialog.component.scss'
})
export class LivroDialogComponent implements OnInit {
  readonly dialogRef    = inject(MatDialogRef<LivroDialogComponent>);
  readonly data         = inject<Livro | null>(MAT_DIALOG_DATA, { optional: true });
  readonly fb           = inject(FormBuilder);
  readonly livroService = inject(LivroService);
  readonly voiceService = inject(VoiceRecognitionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar   = inject(MatSnackBar);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  loading = signal(false);
  imagePreview = signal<string | null>(null);
  isEdit = false;

  /** Rastreia qual campo está escutando no momento: 'titulo' | 'autor' | null */
  listeningField = signal<string | null>(null);

  ngOnInit(): void {
    this.isEdit = !!this.data;
    
    this.form = this.fb.group({
      titulo: [this.data?.titulo || '', [Validators.required, Validators.minLength(2)]],
      autor: [this.data?.autor || '', [Validators.required, Validators.minLength(2)]],
      capaBase64: [this.data?.capaBase64 || '']
    });

    if (this.data?.capaBase64) {
      this.imagePreview.set(this.data.capaBase64);
    }

    // Garante que o microfone seja desligado ao destruir o componente (ex: fechar modal)
    this.destroyRef.onDestroy(() => this.voiceService.stop());
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.compressImage(file).then((base64) => {
      this.form.patchValue({ capaBase64: base64 });
      this.imagePreview.set(base64);
    });

    // Reset para permitir selecionar o mesmo arquivo novamente
    input.value = '';
  }

  removeImage(): void {
    this.form.patchValue({ capaBase64: '' });
    this.imagePreview.set(null);
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

  /**
   * Inicia (ou cancela via toggle) a entrada de voz para o campo especificado.
   * Clicar no mesmo microfone uma segunda vez encerra a gravação.
   * Clicar em um campo diferente aborta o anterior automaticamente (via serviço).
   */
  startVoiceInput(controlName: string): void {
    if (this.listeningField() === controlName) {
      this.voiceService.stop();
      this.listeningField.set(null);
      return;
    }

    this.listeningField.set(controlName);

    this.voiceService
      .listen()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (transcript: string) => {
          const capitalized = transcript.charAt(0).toUpperCase() + transcript.slice(1);
          this.form.patchValue({ [controlName]: capitalized });
          this.listeningField.set(null);
        },
        error: (msg: string) => {
          this.listeningField.set(null);
          this.snackBar.open(msg, 'OK', { duration: 4000 });
        },
        complete: () => {
          this.listeningField.set(null);
        },
      });
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

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        };

        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }
}
