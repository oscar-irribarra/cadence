import { CadenceSensorEvent } from '../../domain/ports/cadence-sensor.port';
import { WebBluetoothCadenceSensor } from './web-bluetooth-adapter';

const CSC_SERVICE_UUID = 0x1816;
const CSC_MEASUREMENT_CHARACTERISTIC_UUID = 0x2a5b;
const DEVICE_INFORMATION_SERVICE_UUID = 0x180a;
const MODEL_NUMBER_CHARACTERISTIC_UUID = 0x2a24;
const MANUFACTURER_NAME_CHARACTERISTIC_UUID = 0x2a29;

class FakeCharacteristic {
  value: DataView | null = null;
  private readonly listeners = new Set<(event: Event) => void>();

  constructor(private readonly text: string | null = null) {}

  async startNotifications(): Promise<void> {}

  async stopNotifications(): Promise<void> {}

  addEventListener(_type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.add(listener as (event: Event) => void);
  }

  removeEventListener(_type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.delete(listener as (event: Event) => void);
  }

  async readValue(): Promise<DataView> {
    if (this.text === null) {
      throw new Error('characteristic is not readable');
    }
    return new DataView(new TextEncoder().encode(this.text).buffer);
  }

  emitValue(value: DataView): void {
    this.value = value;
    for (const listener of this.listeners) {
      listener({ target: this } as unknown as Event);
    }
  }
}

class FakeService {
  constructor(private readonly characteristics: Map<number, FakeCharacteristic>) {}

  async getCharacteristic(uuid: number): Promise<FakeCharacteristic> {
    const characteristic = this.characteristics.get(uuid);
    if (characteristic === undefined) {
      throw new Error(`unknown characteristic ${uuid}`);
    }
    return characteristic;
  }
}

class FakeServer {
  constructor(private readonly services: Map<number, FakeService>) {}

  async getPrimaryService(uuid: number): Promise<FakeService> {
    const service = this.services.get(uuid);
    if (service === undefined) {
      throw new Error(`unknown service ${uuid}`);
    }
    return service;
  }
}

interface FakeDeviceOptions {
  name?: string | null;
  withCscService?: boolean;
  withGattServer?: boolean;
  model?: string;
  manufacturer?: string;
}

class FakeDevice {
  readonly cscCharacteristic = new FakeCharacteristic();
  readonly gatt: {
    connected: boolean;
    connect: () => Promise<FakeServer>;
    disconnect: () => void;
  };

  private readonly listeners = new Set<() => void>();
  private server: FakeServer | null = null;

  constructor(readonly name: string | null) {
    this.gatt = {
      connected: false,
      connect: async () => {
        if (this.server === null) {
          throw new Error('gatt unavailable');
        }
        this.gatt.connected = true;
        return this.server;
      },
      disconnect: () => {
        this.gatt.connected = false;
      },
    };
  }

  attachServer(server: FakeServer): void {
    this.server = server;
  }

  addEventListener(_type: string, listener: () => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: () => void): void {
    this.listeners.delete(listener);
  }
}

function createDevice(options: FakeDeviceOptions = {}): FakeDevice {
  const device = new FakeDevice(options.name ?? 'BK467');

  if (options.withGattServer === false) {
    return device;
  }

  const services = new Map<number, FakeService>();

  if (options.withCscService !== false) {
    const cscCharacteristics = new Map<number, FakeCharacteristic>();
    cscCharacteristics.set(CSC_MEASUREMENT_CHARACTERISTIC_UUID, device.cscCharacteristic);
    services.set(CSC_SERVICE_UUID, new FakeService(cscCharacteristics));
  }

  const informationCharacteristics = new Map<number, FakeCharacteristic>();
  if (options.model !== undefined) {
    informationCharacteristics.set(
      MODEL_NUMBER_CHARACTERISTIC_UUID,
      new FakeCharacteristic(options.model),
    );
  }
  if (options.manufacturer !== undefined) {
    informationCharacteristics.set(
      MANUFACTURER_NAME_CHARACTERISTIC_UUID,
      new FakeCharacteristic(options.manufacturer),
    );
  }
  if (informationCharacteristics.size > 0) {
    services.set(DEVICE_INFORMATION_SERVICE_UUID, new FakeService(informationCharacteristics));
  }

  device.attachServer(new FakeServer(services));
  return device;
}

function stubBluetooth(
  devices: readonly FakeDevice[],
  requestDevice: () => Promise<FakeDevice> = () => Promise.resolve(devices[0]),
): void {
  vi.stubGlobal('navigator', {
    bluetooth: {
      getDevices: () => Promise.resolve([...devices]),
      requestDevice,
    },
  });
}

function crankPayload(revolutions: number, eventTime: number): DataView {
  const view = new DataView(new ArrayBuffer(5));
  view.setUint8(0, 0x02);
  view.setUint16(1, revolutions, true);
  view.setUint16(3, eventTime, true);
  return view;
}

describe('WebBluetoothCadenceSensor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not auto-connect when the browser lacks getDevices', async () => {
    vi.stubGlobal('navigator', { bluetooth: {} });
    const sensor = new WebBluetoothCadenceSensor();

    await expect(sensor.autoConnect()).resolves.toBe(false);
  });

  it('reconnects to a known device and reports its model and manufacturer', async () => {
    const device = createDevice({ name: 'BK467', model: 'BK467', manufacturer: 'CooSpo' });
    stubBluetooth([device]);
    const sensor = new WebBluetoothCadenceSensor();
    const events: CadenceSensorEvent[] = [];
    sensor.subscribe((event) => events.push(event));

    await expect(sensor.autoConnect()).resolves.toBe(true);

    expect(events).toContainEqual({
      kind: 'connection',
      state: 'connected',
      deviceName: 'BK467',
      model: 'BK467',
      manufacturer: 'CooSpo',
      error: null,
    });
    expect(device.gatt.connected).toBe(true);
  });

  it('skips known devices without the CSC service', async () => {
    stubBluetooth([createDevice({ name: 'Other device', withCscService: false })]);
    const sensor = new WebBluetoothCadenceSensor();
    const events: CadenceSensorEvent[] = [];
    sensor.subscribe((event) => events.push(event));

    await expect(sensor.autoConnect()).resolves.toBe(false);

    expect(events).toEqual([]);
  });

  it('falls back to the next known device', async () => {
    const stranger = createDevice({ name: 'Other device', withCscService: false });
    const known = createDevice({ name: 'BK467' });
    stubBluetooth([stranger, known]);
    const sensor = new WebBluetoothCadenceSensor();

    await expect(sensor.autoConnect()).resolves.toBe(true);

    expect(known.gatt.connected).toBe(true);
  });

  it('emits cadence events decoded from CSC notifications', async () => {
    const device = createDevice({ name: 'BK467' });
    stubBluetooth([device]);
    const sensor = new WebBluetoothCadenceSensor();
    const rpms: number[] = [];
    sensor.subscribe((event) => {
      if (event.kind === 'cadence') {
        rpms.push(event.rpm);
      }
    });

    await sensor.autoConnect();
    device.cscCharacteristic.emitValue(crankPayload(100, 0));
    device.cscCharacteristic.emitValue(crankPayload(101, 1024));

    expect(rpms).toContain(60);
  });

  it('reports an error state when the user-selected device cannot connect', async () => {
    const unreachable = createDevice({ name: 'BK467', withGattServer: false });
    stubBluetooth([], () => Promise.resolve(unreachable));
    const sensor = new WebBluetoothCadenceSensor();
    const events: CadenceSensorEvent[] = [];
    sensor.subscribe((event) => events.push(event));

    await sensor.connect();

    expect(events).toContainEqual({
      kind: 'connection',
      state: 'error',
      deviceName: null,
      model: null,
      manufacturer: null,
      error: 'gatt unavailable',
    });
  });

  it('reuses a successful pending auto-connect when connect is called', async () => {
    const device = createDevice({ name: 'BK467' });
    stubBluetooth([device]);
    const sensor = new WebBluetoothCadenceSensor();

    const autoConnect = sensor.autoConnect();
    await sensor.connect();

    await expect(autoConnect).resolves.toBe(true);
    expect(device.gatt.connected).toBe(true);
  });
});
