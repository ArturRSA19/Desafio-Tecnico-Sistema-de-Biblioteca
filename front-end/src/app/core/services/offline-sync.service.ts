import { Injectable, DestroyRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { offlineDb, type SyncQueueEntry } from '../db/offline.db';
import { NetworkStatusService } from './network-status.service';

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly networkStatus = inject(NetworkStatusService);

  private syncing = false;

  constructor() {
    this.networkStatus.isOnline$
      .pipe(
        filter(online => online),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncPendingRequests());
  }

  /**
   * Enfileira uma requisição para envio posterior quando a rede estiver disponível.
   */
  async enqueue(url: string, method: 'POST' | 'PUT', body: unknown): Promise<void> {
    const entry: SyncQueueEntry = {
      url,
      method,
      body,
      timestamp: Date.now(),
    };

    await offlineDb.syncQueue.add(entry);

    this.snackBar.open(
      'Sem conexão — requisição salva offline. Será enviada quando a rede voltar.',
      'OK',
      { duration: 5000 },
    );
  }

  /**
   * Processa todas as requisições pendentes na fila, em ordem FIFO.
   * Chamado automaticamente quando a conexão é restabelecida.
   */
  async syncPendingRequests(): Promise<void> {
    if (this.syncing) {
      return;
    }

    const pending = await offlineDb.syncQueue.orderBy('timestamp').toArray();

    if (pending.length === 0) {
      return;
    }

    this.syncing = true;
    let successCount = 0;
    let failCount = 0;

    for (const entry of pending) {
      try {
        await firstValueFrom(
          this.http.request(entry.method, entry.url, { body: entry.body }),
        );

        await offlineDb.syncQueue.delete(entry.id!);
        successCount++;
      } catch {
        failCount++;
      }
    }

    this.syncing = false;

    if (successCount > 0 && failCount === 0) {
      this.snackBar.open(
        `${successCount} requisição(ões) sincronizada(s) com sucesso.`,
        'OK',
        { duration: 5000 },
      );
    } else if (successCount > 0 && failCount > 0) {
      this.snackBar.open(
        `${successCount} sincronizada(s), ${failCount} ainda pendente(s).`,
        'OK',
        { duration: 5000 },
      );
    } else {
      this.snackBar.open(
        `Falha ao sincronizar ${failCount} requisição(ões). Tentaremos novamente.`,
        'OK',
        { duration: 5000 },
      );
    }
  }

  /**
   * Retorna a quantidade de requisições pendentes na fila.
   */
  async getPendingCount(): Promise<number> {
    return offlineDb.syncQueue.count();
  }
}
