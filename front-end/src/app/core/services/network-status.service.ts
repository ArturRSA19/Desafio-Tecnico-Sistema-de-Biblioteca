import { Injectable, DestroyRef, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Serviço isolado e reutilizável para monitorar o status de conectividade do navegador.
 *
 * Inicializa o estado com `navigator.onLine` e o atualiza em tempo real via
 * os eventos nativos `window.online` / `window.offline`.
 *
 * Event listeners são removidos automaticamente pelo DestroyRef quando a instância
 * for destruída (relevante em testes com hot-reload ou ambientes SSR).
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly _status$ = new BehaviorSubject<boolean>(navigator.onLine);

  /** Observable do status de rede. Emite `true` quando online, `false` quando offline. */
  readonly isOnline$ = this._status$.asObservable();

  /** Getter síncrono para uso em contextos não-reativos (ex: interceptors funcionais). */
  get isOnline(): boolean {
    return this._status$.getValue();
  }

  constructor() {
    const onOnline = () => this._status$.next(true);
    const onOffline = () => this._status$.next(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    });
  }
}
