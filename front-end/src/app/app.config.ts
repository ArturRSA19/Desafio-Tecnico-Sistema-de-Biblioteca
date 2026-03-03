import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

import { networkInterceptor } from './core/interceptors/network.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      // networkInterceptor DEVE vir antes do httpErrorInterceptor:
      // ele captura POST/PUT offline e retorna EMPTY, evitando que
      // o httpErrorInterceptor exiba o snackbar genérico de erro.
      withInterceptors([networkInterceptor, httpErrorInterceptor]),
    ),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
