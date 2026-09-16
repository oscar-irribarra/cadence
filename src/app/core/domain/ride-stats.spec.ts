import { calculateRideStats } from './ride-stats';

describe('calculateRideStats', () => {
  it('returns null when there are no samples', () => {
    expect(calculateRideStats([], 0, 10_000)).toBeNull();
  });

  it('computes min, max, average and duration', () => {
    const stats = calculateRideStats([60, 80, 100], 1_000_000, 1_090_000);

    expect(stats).toEqual({
      startedAt: 1_000_000,
      durationSeconds: 90,
      rpmMin: 60,
      rpmMax: 100,
      rpmAvg: 80,
    });
  });

  it('never returns a negative duration', () => {
    const stats = calculateRideStats([70], 10_000, 5_000);

    expect(stats?.durationSeconds).toBe(0);
  });
});
