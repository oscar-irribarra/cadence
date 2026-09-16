import { Service, computed, inject, signal } from '@angular/core';
import { SensorConnectionState } from '../domain/models/sensor-connection';
import { CadenceSensorEvent } from '../domain/ports/cadence-sensor.port';
import { CADENCE_SENSOR } from '../infrastructure/ble/ble.tokens';
import { isWebBluetoothSupported } from '../infrastructure/ble/web-bluetooth-support';

@Service()
export class SensorConnection {
  private readonly sensor = inject(CADENCE_SENSOR);

  readonly state = signal<SensorConnectionState>('disconnected');
  readonly deviceName = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly rpm = signal<number | null>(null);
  readonly speedModeDetected = signal(false);
  readonly bluetoothSupported = signal(isWebBluetoothSupported());

  readonly connected = computed(() => this.state() === 'connected');
  readonly connecting = computed(() => this.state() === 'connecting');

  constructor() {
    this.sensor.subscribe((event) => this.handleEvent(event));
  }

  async connect(): Promise<void> {
    if (this.connecting() || this.connected()) {
      return;
    }
    await this.sensor.connect();
  }

  disconnect(): void {
    this.sensor.disconnect();
  }

  private handleEvent(event: CadenceSensorEvent): void {
    switch (event.kind) {
      case 'connection':
        this.state.set(event.state);
        this.deviceName.set(event.deviceName);
        this.error.set(event.error);
        if (event.state !== 'connected') {
          this.rpm.set(null);
        }
        if (event.state === 'disconnected') {
          this.speedModeDetected.set(false);
        }
        break;
      case 'cadence':
        this.rpm.set(event.rpm);
        break;
      case 'speed-mode-detected':
        this.speedModeDetected.set(true);
        break;
    }
  }
}
