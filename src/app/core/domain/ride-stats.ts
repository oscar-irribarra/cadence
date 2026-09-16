import { RideStats } from './models/ride-session';

export function calculateRideStats(
  samples: readonly number[],
  startedAt: number,
  endedAt: number,
): RideStats | null {
  if (samples.length === 0) {
    return null;
  }

  const total = samples.reduce((sum, sample) => sum + sample, 0);

  return {
    startedAt,
    durationSeconds: Math.max(0, Math.round((endedAt - startedAt) / 1000)),
    rpmMin: Math.min(...samples),
    rpmMax: Math.max(...samples),
    rpmAvg: Math.round(total / samples.length),
  };
}
