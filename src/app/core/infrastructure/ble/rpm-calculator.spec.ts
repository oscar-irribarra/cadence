import { CscMeasurement } from '../../domain/models/csc-measurement';
import { RpmCalculator } from './rpm-calculator';

const EMPTY_MEASUREMENT: CscMeasurement = {
  wheelRevolutions: null,
  lastWheelEventTime: null,
  crankRevolutions: null,
  lastCrankEventTime: null,
};

function crankMeasurement(revolutions: number, eventTime: number): CscMeasurement {
  return {
    ...EMPTY_MEASUREMENT,
    crankRevolutions: revolutions,
    lastCrankEventTime: eventTime,
  };
}

describe('RpmCalculator', () => {
  it('returns null for the first sample (no baseline yet)', () => {
    const calculator = new RpmCalculator();

    expect(calculator.update(crankMeasurement(100, 0))).toBeNull();
  });

  it('returns null when the payload has no crank data', () => {
    const calculator = new RpmCalculator();

    expect(calculator.update(EMPTY_MEASUREMENT)).toBeNull();
  });

  it('computes 60 rpm for one revolution per second', () => {
    const calculator = new RpmCalculator();
    calculator.update(crankMeasurement(100, 0));

    expect(calculator.update(crankMeasurement(101, 1024))).toBe(60);
  });

  it('computes 90 rpm for three revolutions in two seconds', () => {
    const calculator = new RpmCalculator();
    calculator.update(crankMeasurement(100, 0));

    expect(calculator.update(crankMeasurement(103, 2048))).toBe(90);
  });

  it('handles 16-bit rollover of revolutions and event time', () => {
    const calculator = new RpmCalculator();
    calculator.update(crankMeasurement(0xffff, 0xff00));

    const rpm = calculator.update(crankMeasurement(0x0001, 0x0100));

    expect(rpm).toBe(240);
  });

  it('returns null when the event time does not advance', () => {
    const calculator = new RpmCalculator();
    calculator.update(crankMeasurement(100, 500));

    expect(calculator.update(crankMeasurement(101, 500))).toBeNull();
  });

  it('reports 0 rpm when the crank has not moved between samples', () => {
    const calculator = new RpmCalculator();
    calculator.update(crankMeasurement(100, 0));

    expect(calculator.update(crankMeasurement(100, 1024))).toBe(0);
  });

  it('requires a new baseline after reset', () => {
    const calculator = new RpmCalculator();
    calculator.update(crankMeasurement(100, 0));
    calculator.update(crankMeasurement(101, 1024));

    calculator.reset();

    expect(calculator.update(crankMeasurement(102, 2048))).toBeNull();
  });
});
