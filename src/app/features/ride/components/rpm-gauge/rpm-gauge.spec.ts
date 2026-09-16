import { TestBed } from '@angular/core/testing';
import { RpmGauge } from './rpm-gauge';

describe('RpmGauge', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpmGauge],
    }).compileComponents();
  });

  it('shows a placeholder when there is no reading', async () => {
    const fixture = TestBed.createComponent(RpmGauge);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('--');
  });

  it('shows the rounded rpm when a reading is available', async () => {
    const fixture = TestBed.createComponent(RpmGauge);
    fixture.componentRef.setInput('rpm', 82.6);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('83');
  });
});
