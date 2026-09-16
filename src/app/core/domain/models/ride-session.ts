export interface RideStats {
  readonly startedAt: number;
  readonly durationSeconds: number;
  readonly rpmMin: number;
  readonly rpmMax: number;
  readonly rpmAvg: number;
}

export interface RideSession extends RideStats {
  readonly id: string;
}
