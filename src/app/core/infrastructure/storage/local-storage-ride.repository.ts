import { RideSession } from '../../domain/models/ride-session';
import { RideRepository } from '../../domain/ports/ride-repository.port';

const STORAGE_KEY = 'cadence.rides';

export class LocalStorageRideRepository implements RideRepository {
  save(session: RideSession): void {
    const sessions = this.getAll();
    sessions.push(session);
    this.write(sessions);
  }

  getAll(): RideSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RideSession[]) : [];
    } catch {
      return [];
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      return;
    }
  }

  private write(sessions: readonly RideSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      return;
    }
  }
}
