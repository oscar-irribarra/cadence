import {
  CadenceSensorEvent,
  CadenceSensorPort,
  Unsubscribe,
} from '../../domain/ports/cadence-sensor.port';

const CONNECT_DELAY_MS = 400;
const SAMPLE_INTERVAL_MS = 1000;
const BASE_RPM = 80;
const RPM_AMPLITUDE = 25;

export class MockCadenceSensor implements CadenceSensorPort {
  private readonly listeners = new Set<(event: CadenceSensorEvent) => void>();
  private sampleInterval: ReturnType<typeof setInterval> | null = null;
  private sampleIndex = 0;

  async connect(): Promise<void> {
    this.emit({
      kind: 'connection',
      state: 'connecting',
      deviceName: null,
      model: null,
      manufacturer: null,
      error: null,
    });
    await new Promise((resolve) => setTimeout(resolve, CONNECT_DELAY_MS));

    this.sampleIndex = 0;
    this.sampleInterval = setInterval(() => {
      this.sampleIndex += 1;
      const rpm = Math.round(BASE_RPM + RPM_AMPLITUDE * Math.sin(this.sampleIndex / 6));
      this.emit({ kind: 'cadence', rpm });
    }, SAMPLE_INTERVAL_MS);

    this.emit({
      kind: 'connection',
      state: 'connected',
      deviceName: 'BK467 (simulado)',
      model: 'BK467 (simulado)',
      manufacturer: null,
      error: null,
    });
  }

  autoConnect(): Promise<boolean> {
    return Promise.resolve(false);
  }

  disconnect(): void {
    this.stopSampling();
    this.emit({
      kind: 'connection',
      state: 'disconnected',
      deviceName: null,
      model: null,
      manufacturer: null,
      error: null,
    });
  }

  subscribe(listener: (event: CadenceSensorEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private stopSampling(): void {
    if (this.sampleInterval !== null) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }
  }

  private emit(event: CadenceSensorEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
