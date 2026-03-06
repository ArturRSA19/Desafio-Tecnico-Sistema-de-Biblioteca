import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError } from 'rxjs';

import { OfflineSyncService } from '../services/offline-sync.service';
import { NetworkStatusService } from '../services/network-status.service';

/**
 * Interceptor funcional que captura requisições POST/PUT quando offline
 * e as enfileira no IndexedDB para envio posterior.
 *
 * Deve ser registrado ANTES do httpErrorInterceptor no array de interceptors
 * para evitar que o snackbar genérico de "Erro de conexão" seja exibido
 * quando a requisição já foi enfileirada com sucesso.
 */
export const networkInterceptor: HttpInterceptorFn = (req, next) => {
  const method = req.method.toUpperCase();

  // Apenas POST e PUT são enfileirados offline (cadastro e aluguel)
  if (method !== 'POST' && method !== 'PUT') {
    return next(req);
  }

  const offlineSyncService = inject(OfflineSyncService);
  const networkStatus = inject(NetworkStatusService);

  // Pré-check: se já estamos offline, enfileira imediatamente
  if (!networkStatus.isOnline) {
    offlineSyncService.enqueue(req.urlWithParams, method as 'POST' | 'PUT', req.body);
    return EMPTY;
  }

  // Se estamos online, tenta enviar normalmente.
  // Se falhar com status 0 (rede caiu durante a requisição), enfileira.
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        offlineSyncService.enqueue(req.urlWithParams, method as 'POST' | 'PUT', req.body);
        return EMPTY;
      }

      // Qualquer outro erro é propagado para o httpErrorInterceptor downstream
      throw error;
    }),
  );
};
