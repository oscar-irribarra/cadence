import { Component, computed, input } from '@angular/core';

const GAUGE_RADIUS = 90;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

@Component({
  selector: 'app-rpm-gauge',
  template: `
    <div
      class="relative mx-auto aspect-square w-full max-w-[280px]"
      role="meter"
      aria-label="Cadencia"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="maxRpm()"
      [attr.aria-valuenow]="ariaValueNow()"
      [attr.aria-valuetext]="ariaValueText()"
    >
      <svg viewBox="0 0 200 200" class="h-full w-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          [attr.r]="radius"
          fill="none"
          stroke-width="12"
          class="stroke-zinc-800"
        />
        <circle
          cx="100"
          cy="100"
          [attr.r]="radius"
          fill="none"
          stroke-width="12"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset()"
          class="transition-[stroke-dashoffset] duration-500 ease-out"
          [class.stroke-lime-400]="hasReading()"
          [class.stroke-zinc-700]="!hasReading()"
        />
      </svg>

      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span
          class="font-mono text-6xl font-bold tabular-nums"
          [class.text-zinc-50]="hasReading()"
          [class.text-zinc-600]="!hasReading()"
        >
          {{ displayRpm() }}
        </span>
        <span class="mt-2 text-xs font-medium tracking-[0.35em] text-zinc-500">RPM</span>
      </div>
    </div>
  `,
})
export class RpmGauge {
  readonly rpm = input<number | null>(null);
  readonly maxRpm = input(200);

  protected readonly radius = GAUGE_RADIUS;
  protected readonly circumference = GAUGE_CIRCUMFERENCE;

  protected readonly hasReading = computed(() => this.rpm() !== null);

  protected readonly roundedRpm = computed(() => {
    const rpm = this.rpm();
    return rpm === null ? null : Math.round(rpm);
  });

  protected readonly displayRpm = computed(() => {
    const rpm = this.roundedRpm();
    return rpm === null ? '--' : rpm.toString();
  });

  protected readonly ariaValueNow = computed(() => this.roundedRpm() ?? 0);

  protected readonly ariaValueText = computed(() => {
    const rpm = this.roundedRpm();
    return rpm === null ? 'Sin datos' : `${rpm} RPM`;
  });

  protected readonly dashOffset = computed(() => {
    const rpm = this.rpm();
    const fraction = rpm === null ? 0 : Math.min(Math.max(rpm / this.maxRpm(), 0), 1);
    return GAUGE_CIRCUMFERENCE * (1 - fraction);
  });
}
