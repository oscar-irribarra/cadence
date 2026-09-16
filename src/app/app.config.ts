import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {
  ApplicationConfig,
  LOCALE_ID,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { CadenceSensorPort } from './core/domain/ports/cadence-sensor.port';
import { CADENCE_SENSOR } from './core/infrastructure/ble/ble.tokens';
import { MockCadenceSensor } from './core/infrastructure/ble/mock-sensor.adapter';
import { WebBluetoothCadenceSensor } from './core/infrastructure/ble/web-bluetooth-adapter';
import { LocalStorageRideRepository } from './core/infrastructure/storage/local-storage-ride.repository';
import { RIDE_REPOSITORY } from './core/infrastructure/storage/storage.tokens';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    {
      provide: CADENCE_SENSOR,
      useFactory: (): CadenceSensorPort =>
        environment.useMockSensor ? new MockCadenceSensor() : new WebBluetoothCadenceSensor(),
    },
    { provide: RIDE_REPOSITORY, useClass: LocalStorageRideRepository },
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};
