import { TestBed } from '@angular/core/testing';
import { RideSession } from '../../../core/domain/models/ride-session';
import { RideRepository } from '../../../core/domain/ports/ride-repository.port';
import { RIDE_REPOSITORY } from '../../../core/infrastructure/storage/storage.tokens';
import { HistoryPage } from './history-page';

class StubRideRepository implements RideRepository {
  private readonly sessions: RideSession[] = [];

  save(session: RideSession): void {
    this.sessions.push(session);
  }

  getAll(): RideSession[] {
    return [...this.sessions];
  }

  clear(): void {
    this.sessions.length = 0;
  }
}

describe('HistoryPage', () => {
  it('shows the empty state when there are no sessions', async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [{ provide: RIDE_REPOSITORY, useValue: new StubRideRepository() }],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryPage);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Aún no hay rodadas');
  });

  it('lists stored sessions', async () => {
    const repository = new StubRideRepository();
    repository.save({
      id: 'x1',
      startedAt: Date.now(),
      durationSeconds: 60,
      rpmMin: 50,
      rpmMax: 90,
      rpmAvg: 70,
    });

    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [{ provide: RIDE_REPOSITORY, useValue: repository }],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryPage);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('70');
  });
});
