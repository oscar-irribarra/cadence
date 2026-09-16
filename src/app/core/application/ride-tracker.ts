import { Service, inject, signal } from '@angular/core';
import { calculateRideStats } from '../domain/ride-stats';
import { RIDE_REPOSITORY } from '../infrastructure/storage/storage.tokens';
import { SensorConnection } from './sensor-connection';

const SAMPLE_INTERVAL_MS = 1000;

@Service()
export class RideTracker {
  private readonly repository = inject(RIDE_REPOSITORY);
  private readonly sensor = inject(SensorConnection);

  private readonly samples: number[] = [];
  private startedAt: number | null = null;
  private sampleInterval: ReturnType<typeof setInterval> | null = null;

  readonly isRecording = signal(false);
  readonly elapsedSeconds = signal(0);

  start(): void {
    if (this.isRecording()) {
      return;
    }

    this.samples.length = 0;
    this.startedAt = Date.now();
    this.elapsedSeconds.set(0);
    this.isRecording.set(true);
    this.sampleInterval = setInterval(() => this.tick(), SAMPLE_INTERVAL_MS);
  }

  stop(): void {
    if (!this.isRecording() || this.startedAt === null) {
      return;
    }

    this.clearSampleInterval();
    const startedAt = this.startedAt;
    const stats = calculateRideStats(this.samples, startedAt, Date.now());
    if (stats !== null) {
      this.repository.save({ id: crypto.randomUUID(), ...stats });
    }

    this.samples.length = 0;
    this.startedAt = null;
    this.isRecording.set(false);
    this.elapsedSeconds.set(0);
  }

  private tick(): void {
    const startedAt = this.startedAt;
    if (startedAt === null) {
      return;
    }

    this.elapsedSeconds.set(Math.floor((Date.now() - startedAt) / 1000));

    const rpm = this.sensor.rpm();
    if (rpm !== null) {
      this.samples.push(rpm);
    }
  }

  private clearSampleInterval(): void {
    if (this.sampleInterval !== null) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }
  }
}
