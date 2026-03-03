import { Component, DestroyRef, NgZone, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { OfflineSyncService } from './core/services/offline-sync.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly offlineSyncService = inject(OfflineSyncService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const onOnline = (): void => {
      // NgZone.run garante que snackbar/UI atualizem corretamente,
      // pois o evento 'online' dispara fora da zona do Angular.
      this.ngZone.run(() => {
        this.offlineSyncService.syncPendingRequests();
      });
    };

    window.addEventListener('online', onOnline);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', onOnline);
    });
  }
}
