import { TestBed } from '@angular/core/testing';
import {
  CadenceSensorEvent,
  CadenceSensorPort,
  Unsubscribe,
} from '../domain/ports/cadence-sensor.port';
import { CADENCE_SENSOR } from '../infrastructure/ble/ble.tokens';
import { SensorConnection } from './sensor-connection';

class StubCadenceSensor implements CadenceSensorPort {
  autoConnectCalls = 0;

  private readonly listeners = new Set<(event: CadenceSensorEvent) => void>();

  connect(): Promise<void> {
    return Promise.resolve();
  }

  autoConnect(): Promise<boolean> {
    this.autoConnectCalls += 1;
    return Promise.resolve(false);
  }

  disconnect(): void {}

  subscribe(listener: (event: CadenceSensorEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: CadenceSensorEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

describe('SensorConnection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('auto-connects on creation when Web Bluetooth is available', async () => {
    vi.stubGlobal('navigator', { bluetooth: {} });
    const sensor = new StubCadenceSensor();
    TestBed.configureTestingModule({
      providers: [{ provide: CADENCE_SENSOR, useValue: sensor }],
    });

    TestBed.inject(SensorConnection);

    await vi.waitFor(() => {
      expect(sensor.autoConnectCalls).toBe(1);
    });
  });

  it('does not auto-connect when Web Bluetooth is unavailable', () => {
    const sensor = new StubCadenceSensor();
    TestBed.configureTestingModule({
      providers: [{ provide: CADENCE_SENSOR, useValue: sensor }],
    });

    TestBed.inject(SensorConnection);

    expect(sensor.autoConnectCalls).toBe(0);
  });

  it('exposes device information and cadence from sensor events', () => {
    const sensor = new StubCadenceSensor();
    TestBed.configureTestingModule({
      providers: [{ provide: CADENCE_SENSOR, useValue: sensor }],
    });
    const service = TestBed.inject(SensorConnection);

    sensor.emit({
      kind: 'connection',
      state: 'connected',
      deviceName: 'BK467',
      model: 'BK467',
      manufacturer: 'CooSpo',
      error: null,
    });
    sensor.emit({ kind: 'cadence', rpm: 88 });

    expect(service.connected()).toBe(true);
    expect(service.deviceModel()).toBe('BK467');
    expect(service.deviceManufacturer()).toBe('CooSpo');
    expect(service.rpm()).toBe(88);
  });
});
