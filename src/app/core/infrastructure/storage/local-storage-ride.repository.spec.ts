import { RideSession } from '../../domain/models/ride-session';
import { LocalStorageRideRepository } from './local-storage-ride.repository';

const SESSION: RideSession = {
  id: 'a1',
  startedAt: 1000,
  durationSeconds: 60,
  rpmMin: 60,
  rpmMax: 100,
  rpmAvg: 80,
};

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('LocalStorageRideRepository', () => {
  let repository: LocalStorageRideRepository;

  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    repository = new LocalStorageRideRepository();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty', () => {
    expect(repository.getAll()).toEqual([]);
  });

  it('saves and retrieves sessions in order', () => {
    repository.save(SESSION);
    repository.save({ ...SESSION, id: 'a2' });

    expect(repository.getAll()).toEqual([SESSION, { ...SESSION, id: 'a2' }]);
  });

  it('clears all sessions', () => {
    repository.save(SESSION);

    repository.clear();

    expect(repository.getAll()).toEqual([]);
  });

  it('recovers from corrupted storage', () => {
    localStorage.setItem('cadence.rides', 'not-json');

    expect(repository.getAll()).toEqual([]);
  });
});
