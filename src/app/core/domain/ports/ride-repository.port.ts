import { RideSession } from '../models/ride-session';

export interface RideRepository {
  save(session: RideSession): void;
  getAll(): RideSession[];
  clear(): void;
}
