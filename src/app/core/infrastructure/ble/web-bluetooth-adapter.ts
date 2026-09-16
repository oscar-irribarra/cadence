import { CscMeasurement } from '../../domain/models/csc-measurement';
import { SensorConnectionState } from '../../domain/models/sensor-connection';
import {
  CadenceSensorEvent,
  CadenceSensorPort,
  Unsubscribe,
} from '../../domain/ports/cadence-sensor.port';
import { parseCscMeasurement } from './csc-parser';
import { RpmCalculator } from './rpm-calculator';

const CSC_SERVICE_UUID = 0x1816;
const CSC_MEASUREMENT_CHARACTERISTIC_UUID = 0x2a5b;
const DEVICE_INFORMATION_SERVICE_UUID = 0x180a;
const MODEL_NUMBER_CHARACTERISTIC_UUID = 0x2a24;
const MANUFACTURER_NAME_CHARACTERISTIC_UUID = 0x2a29;
const IDLE_TIMEOUT_MS = 3000;

interface DeviceInformation {
  readonly model: string | null;
  readonly manufacturer: string | null;
}

const UNKNOWN_DEVICE_INFORMATION: DeviceInformation = { model: null, manufacturer: null };

export class WebBluetoothCadenceSensor implements CadenceSensorPort {
  private readonly listeners = new Set<(event: CadenceSensorEvent) => void>();
  private readonly rpmCalculator = new RpmCalculator();

  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private idleTimeout: ReturnType<typeof setTimeout> | null = null;
  private speedModeDetected = false;
  private autoConnectPromise: Promise<boolean> | null = null;

  async connect(): Promise<void> {
    if (this.autoConnectPromise !== null) {
      const alreadyConnected = await this.autoConnectPromise;
      if (alreadyConnected) {
        return;
      }
    }

    this.emitConnection('connecting');

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [CSC_SERVICE_UUID] }],
      });
      const information = await this.openConnection(device);
      this.emitConnected(device, information);
    } catch (error) {
      this.releaseDevice();
      if (isUserCancellation(error)) {
        this.emitConnection('disconnected');
        return;
      }
      this.emitConnection('error', errorMessage(error));
    }
  }

  async autoConnect(): Promise<boolean> {
    if (this.autoConnectPromise === null) {
      this.autoConnectPromise = this.runAutoConnect().finally(() => {
        this.autoConnectPromise = null;
      });
    }
    return this.autoConnectPromise;
  }

  disconnect(): void {
    this.releaseDevice();
    this.emitConnection('disconnected');
  }

  subscribe(listener: (event: CadenceSensorEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async runAutoConnect(): Promise<boolean> {
    if (typeof navigator.bluetooth.getDevices !== 'function') {
      return false;
    }

    let devices: BluetoothDevice[];
    try {
      devices = await navigator.bluetooth.getDevices();
    } catch {
      return false;
    }

    for (const device of devices) {
      try {
        const information = await this.openConnection(device);
        this.emitConnected(device, information);
        return true;
      } catch {
        this.releaseDevice();
      }
    }

    return false;
  }

  private async openConnection(device: BluetoothDevice): Promise<DeviceInformation> {
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

    return readDeviceInformation(server);
  }

  private emitConnected(device: BluetoothDevice, information: DeviceInformation): void {
    this.emit({
      kind: 'connection',
      state: 'connected',
      deviceName: device.name ?? null,
      model: information.model,
      manufacturer: information.manufacturer,
      error: null,
    });
  }

  private emitConnection(
    state: Exclude<SensorConnectionState, 'connected'>,
    error: string | null = null,
  ): void {
    this.emit({
      kind: 'connection',
      state,
      deviceName: null,
      model: null,
      manufacturer: null,
      error,
    });
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
    this.emitConnection('disconnected');
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

async function readDeviceInformation(server: BluetoothRemoteGATTServer): Promise<DeviceInformation> {
  let service: BluetoothRemoteGATTService;
  try {
    service = await server.getPrimaryService(DEVICE_INFORMATION_SERVICE_UUID);
  } catch {
    return UNKNOWN_DEVICE_INFORMATION;
  }

  const [model, manufacturer] = await Promise.all([
    readCharacteristicText(service, MODEL_NUMBER_CHARACTERISTIC_UUID),
    readCharacteristicText(service, MANUFACTURER_NAME_CHARACTERISTIC_UUID),
  ]);

  return { model, manufacturer };
}

async function readCharacteristicText(
  service: BluetoothRemoteGATTService,
  characteristicUuid: number,
): Promise<string | null> {
  try {
    const characteristic = await service.getCharacteristic(characteristicUuid);
    const value = await characteristic.readValue();
    const text = new TextDecoder().decode(value).trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

function isUserCancellation(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotFoundError';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}
