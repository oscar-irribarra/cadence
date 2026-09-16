import { parseCscMeasurement } from './csc-parser';

function createDataView(bytes: readonly number[]): DataView {
  return new DataView(new Uint8Array(bytes).buffer);
}

describe('parseCscMeasurement', () => {
  it('parses a crank-only (cadence) payload', () => {
    const measurement = parseCscMeasurement(createDataView([0x02, 0x34, 0x12, 0x00, 0x04]));

    expect(measurement.crankRevolutions).toBe(0x1234);
    expect(measurement.lastCrankEventTime).toBe(0x0400);
    expect(measurement.wheelRevolutions).toBeNull();
    expect(measurement.lastWheelEventTime).toBeNull();
  });

  it('parses a wheel-only (speed) payload', () => {
    const measurement = parseCscMeasurement(
      createDataView([0x01, 0x01, 0x00, 0x00, 0x00, 0xff, 0x03]),
    );

    expect(measurement.wheelRevolutions).toBe(1);
    expect(measurement.lastWheelEventTime).toBe(0x03ff);
    expect(measurement.crankRevolutions).toBeNull();
    expect(measurement.lastCrankEventTime).toBeNull();
  });

  it('parses a payload with both wheel and crank data', () => {
    const bytes = [0x03, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x02, 0x64, 0x00, 0x00, 0x08];
    const measurement = parseCscMeasurement(createDataView(bytes));

    expect(measurement.wheelRevolutions).toBe(10);
    expect(measurement.lastWheelEventTime).toBe(0x0200);
    expect(measurement.crankRevolutions).toBe(100);
    expect(measurement.lastCrankEventTime).toBe(0x0800);
  });

  it('returns nulls when no data flags are set', () => {
    const measurement = parseCscMeasurement(createDataView([0x00]));

    expect(measurement).toEqual({
      wheelRevolutions: null,
      lastWheelEventTime: null,
      crankRevolutions: null,
      lastCrankEventTime: null,
    });
  });
});
