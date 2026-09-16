import { Component, computed, inject } from '@angular/core';
import { RideTracker } from '../../../core/application/ride-tracker';
import { SensorConnection } from '../../../core/application/sensor-connection';
import { CompatibilityBanner } from '../../../shared/components/compatibility-banner/compatibility-banner';
import { RideControls } from '../components/ride-controls/ride-controls';
import { RpmGauge } from '../components/rpm-gauge/rpm-gauge';
import { SensorConnect } from '../components/sensor-connect/sensor-connect';

const SPEED_MODE_NOTICE =
  'El sensor está en modo velocidad. Reinstala su batería para cambiar al modo cadencia (LED azul).';

@Component({
  selector: 'app-ride-page',
  imports: [CompatibilityBanner, SensorConnect, RpmGauge, RideControls],
  template: `
    <div class="flex flex-col gap-10">
      <h1 class="sr-only">Rodada</h1>

      <app-compatibility-banner [visible]="!sensor.bluetoothSupported()" />

      <app-sensor-connect
        [state]="sensor.state()"
        [deviceName]="sensor.deviceName()"
        [model]="sensor.deviceModel()"
        [manufacturer]="sensor.deviceManufacturer()"
        [notice]="notice()"
        (connect)="sensor.connect()"
        (disconnect)="sensor.disconnect()"
      />

      <app-rpm-gauge [rpm]="sensor.rpm()" />

      <app-ride-controls
        [recording]="tracker.isRecording()"
        [elapsedSeconds]="tracker.elapsedSeconds()"
        [canStart]="canStart()"
        (start)="tracker.start()"
        (stop)="tracker.stop()"
      />
    </div>
  `,
})
export class RidePage {
  protected readonly sensor = inject(SensorConnection);
  protected readonly tracker = inject(RideTracker);

  protected readonly canStart = computed(
    () => this.sensor.connected() && !this.sensor.speedModeDetected(),
  );

  protected readonly notice = computed(() => {
    if (this.sensor.speedModeDetected()) {
      return SPEED_MODE_NOTICE;
    }
    const error = this.sensor.error();
    return error === null ? null : `No se pudo conectar: ${error}`;
  });
}
