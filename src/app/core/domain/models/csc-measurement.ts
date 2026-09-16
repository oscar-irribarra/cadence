export interface CscMeasurement {
  readonly wheelRevolutions: number | null;
  readonly lastWheelEventTime: number | null;
  readonly crankRevolutions: number | null;
  readonly lastCrankEventTime: number | null;
}
