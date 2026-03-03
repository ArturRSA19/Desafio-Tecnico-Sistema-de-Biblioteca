import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Erro desconhecido';
      
      if (error.status === 400) {
        message = error.error.message || 'Dados inválidos';
      } else if (error.status === 404) {
        message = 'Recurso não encontrado';
      } else if (error.status === 409) {
        message = error.error.message || 'Conflito de dados';
      } else if (error.status === 0) {
        // Para POST/PUT, o networkInterceptor upstream já enfileira offline
        // e retorna EMPTY, então este bloco só é atingido por GET/DELETE
        // ou cenários edge onde o networkInterceptor não interceptou.
        message = 'Erro de conexão com o servidor';
      }
      
      snackBar.open(message, undefined, { duration: 5000 });
      return throwError(() => error);
    })
  );
};
