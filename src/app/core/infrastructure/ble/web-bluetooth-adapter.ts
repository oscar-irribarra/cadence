import { CscMeasurement } from '../../domain/models/csc-measurement';
import {
  CadenceSensorEvent,
  CadenceSensorPort,
  Unsubscribe,
} from '../../domain/ports/cadence-sensor.port';
import { parseCscMeasurement } from './csc-parser';
import { RpmCalculator } from './rpm-calculator';

const CSC_SERVICE_UUID = 0x1816;
const CSC_MEASUREMENT_CHARACTERISTIC_UUID = 0x2a5b;
const IDLE_TIMEOUT_MS = 3000;

export class WebBluetoothCadenceSensor implements CadenceSensorPort {
  private readonly listeners = new Set<(event: CadenceSensorEvent) => void>();
  private readonly rpmCalculator = new RpmCalculator();

  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private idleTimeout: ReturnType<typeof setTimeout> | null = null;
  private speedModeDetected = false;

  async connect(): Promise<void> {
    this.emit({ kind: 'connection', state: 'connecting', deviceName: null, error: null });

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [CSC_SERVICE_UUID] }],
      });
      this.device = device;
      device.addEventListener('gattserverdisconnected', this.handleGattServerDisconnected);

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('El dispositivo no ofrece conexión GATT');
      }

      const service = await server.getPrimaryService(CSC_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CSC_MEASUREMENT_CHARACTERISTIC_UUID);
      await characteristic.startNotifications();
      characteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleCharacteristicValueChanged,
      );

      this.characteristic = characteristic;
      this.speedModeDetected = false;
      this.emit({
        kind: 'connection',
        state: 'connected',
        deviceName: device.name ?? null,
        error: null,
      });
    } catch (error) {
      this.releaseDevice();
      if (isUserCancellation(error)) {
        this.emit({ kind: 'connection', state: 'disconnected', deviceName: null, error: null });
        return;
      }
      this.emit({
        kind: 'connection',
        state: 'error',
        deviceName: null,
        error: errorMessage(error),
      });
    }
  }

  disconnect(): void {
    this.releaseDevice();
    this.emit({ kind: 'connection', state: 'disconnected', deviceName: null, error: null });
  }

  subscribe(listener: (event: CadenceSensorEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private readonly handleCharacteristicValueChanged = (event: Event): void => {
    const source = event.target as BluetoothRemoteGATTCharacteristic;
    if (!source.value) {
      return;
    }

    const measurement = parseCscMeasurement(source.value);
    this.detectSpeedMode(measurement);

    const rpm = this.rpmCalculator.update(measurement);
    if (rpm !== null) {
      this.emit({ kind: 'cadence', rpm: Math.max(0, Math.round(rpm)) });
    }

    this.restartIdleTimeout();
  };

  private readonly handleGattServerDisconnected = (): void => {
    this.releaseDevice();
    this.emit({ kind: 'connection', state: 'disconnected', deviceName: null, error: null });
  };

  private detectSpeedMode(measurement: CscMeasurement): void {
    const reportsWheelData = measurement.wheelRevolutions !== null;
    const reportsCrankData = measurement.crankRevolutions !== null;

    if (reportsWheelData && !reportsCrankData && !this.speedModeDetected) {
      this.speedModeDetected = true;
      this.emit({ kind: 'speed-mode-detected' });
    }
  }

  private restartIdleTimeout(): void {
    this.clearIdleTimeout();
    this.idleTimeout = setTimeout(() => {
      this.idleTimeout = null;
      this.rpmCalculator.reset();
      this.emit({ kind: 'cadence', rpm: 0 });
    }, IDLE_TIMEOUT_MS);
  }

  private clearIdleTimeout(): void {
    if (this.idleTimeout !== null) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  private releaseDevice(): void {
    this.clearIdleTimeout();
    this.rpmCalculator.reset();

    if (this.characteristic !== null) {
      this.characteristic.removeEventListener(
        'characteristicvaluechanged',
        this.handleCharacteristicValueChanged,
      );
      this.characteristic.stopNotifications().catch(() => undefined);
      this.characteristic = null;
    }

    if (this.device !== null) {
      this.device.removeEventListener('gattserverdisconnected', this.handleGattServerDisconnected);
      this.device.gatt?.disconnect();
      this.device = null;
    }
  }

  private emit(event: CadenceSensorEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

function isUserCancellation(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotFoundError';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}
