import { TestBed } from '@angular/core/testing';
import { RideRepository } from '../../../core/domain/ports/ride-repository.port';
import { RideSession } from '../../../core/domain/models/ride-session';
import {
  CadenceSensorEvent,
  CadenceSensorPort,
  Unsubscribe,
} from '../../../core/domain/ports/cadence-sensor.port';
import { CADENCE_SENSOR } from '../../../core/infrastructure/ble/ble.tokens';
import { RIDE_REPOSITORY } from '../../../core/infrastructure/storage/storage.tokens';
import { RidePage } from './ride-page';

class StubCadenceSensor implements CadenceSensorPort {
  private readonly listeners = new Set<(event: CadenceSensorEvent) => void>();

  connect(): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): void {}

  subscribe(listener: (event: CadenceSensorEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: CadenceSensorEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

class StubRideRepository implements RideRepository {
  save(_session: RideSession): void {}

  getAll(): RideSession[] {
    return [];
  }

  clear(): void {}
}

describe('RidePage', () => {
  let sensor: StubCadenceSensor;

  beforeEach(async () => {
    sensor = new StubCadenceSensor();
    await TestBed.configureTestingModule({
      imports: [RidePage],
      providers: [
        { provide: CADENCE_SENSOR, useValue: sensor },
        { provide: RIDE_REPOSITORY, useValue: new StubRideRepository() },
      ],
    }).compileComponents();
  });

  it('shows the gauge placeholder while disconnected', async () => {
    const fixture = TestBed.createComponent(RidePage);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('--');
  });

  it('shows cadence values emitted by the sensor', async () => {
    const fixture = TestBed.createComponent(RidePage);
    await fixture.whenStable();

    sensor.emit({ kind: 'connection', state: 'connected', deviceName: 'BK467', error: null });
    sensor.emit({ kind: 'cadence', rpm: 90 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('90');
  });
});
