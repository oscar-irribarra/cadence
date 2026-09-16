import { Service, inject, signal } from '@angular/core';
import { RideSession } from '../domain/models/ride-session';
import { RIDE_REPOSITORY } from '../infrastructure/storage/storage.tokens';

@Service()
export class RideHistory {
  private readonly repository = inject(RIDE_REPOSITORY);

  readonly sessions = signal<readonly RideSession[]>([]);

  constructor() {
    this.reload();
  }

  reload(): void {
    const sessions = [...this.repository.getAll()].sort((a, b) => b.startedAt - a.startedAt);
    this.sessions.set(sessions);
  }

  clearAll(): void {
    this.repository.clear();
    this.sessions.set([]);
  }
}
