import { CscMeasurement } from '../../domain/models/csc-measurement';

const WHEEL_DATA_FLAG = 0x01;
const CRANK_DATA_FLAG = 0x02;

export function parseCscMeasurement(data: DataView): CscMeasurement {
  const flags = data.getUint8(0);
  let offset = 1;

  let wheelRevolutions: number | null = null;
  let lastWheelEventTime: number | null = null;
  let crankRevolutions: number | null = null;
  let lastCrankEventTime: number | null = null;

  if (flags & WHEEL_DATA_FLAG) {
    wheelRevolutions = data.getUint32(offset, true);
    lastWheelEventTime = data.getUint16(offset + 4, true);
    offset += 6;
  }

  if (flags & CRANK_DATA_FLAG) {
    crankRevolutions = data.getUint16(offset, true);
    lastCrankEventTime = data.getUint16(offset + 2, true);
  }

  return { wheelRevolutions, lastWheelEventTime, crankRevolutions, lastCrankEventTime };
}
