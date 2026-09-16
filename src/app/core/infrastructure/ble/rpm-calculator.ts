import { CscMeasurement } from '../../domain/models/csc-measurement';

const COUNTER_ROLLOVER = 0x10000;
const EVENT_TIME_UNITS_PER_SECOND = 1024;
const SECONDS_PER_MINUTE = 60;

export class RpmCalculator {
  private previousCrankRevolutions: number | null = null;
  private previousCrankEventTime: number | null = null;

  update(measurement: CscMeasurement): number | null {
    const { crankRevolutions, lastCrankEventTime } = measurement;

    if (crankRevolutions === null || lastCrankEventTime === null) {
      return null;
    }

    if (this.previousCrankRevolutions === null || this.previousCrankEventTime === null) {
      this.previousCrankRevolutions = crankRevolutions;
      this.previousCrankEventTime = lastCrankEventTime;
      return null;
    }

    const revolutionsDelta = wrapAroundDelta(crankRevolutions, this.previousCrankRevolutions);
    const eventTimeDelta = wrapAroundDelta(lastCrankEventTime, this.previousCrankEventTime);

    this.previousCrankRevolutions = crankRevolutions;
    this.previousCrankEventTime = lastCrankEventTime;

    if (eventTimeDelta === 0) {
      return null;
    }

    const elapsedSeconds = eventTimeDelta / EVENT_TIME_UNITS_PER_SECOND;
    return (revolutionsDelta / elapsedSeconds) * SECONDS_PER_MINUTE;
  }

  reset(): void {
    this.previousCrankRevolutions = null;
    this.previousCrankEventTime = null;
  }
}

function wrapAroundDelta(current: number, previous: number): number {
  return current >= previous ? current - previous : current + COUNTER_ROLLOVER - previous;
}
