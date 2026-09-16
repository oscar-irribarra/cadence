import { Component, input, output } from '@angular/core';
import { DurationPipe } from '../../../../shared/pipes/duration-pipe';

@Component({
  selector: 'app-ride-controls',
  imports: [DurationPipe],
  template: `
    <section class="flex flex-col items-center gap-4">
      <p
        class="font-mono text-3xl tabular-nums"
        [class.text-zinc-200]="recording()"
        [class.text-zinc-600]="!recording()"
      >
        {{ elapsedSeconds() | duration }}
      </p>

      <button
        type="button"
        class="w-full rounded-2xl border px-6 py-4 text-lg font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        [class.border-rose-400]="recording()"
        [class.bg-rose-500/20]="recording()"
        [class.text-rose-200]="recording()"
        [class.hover:bg-rose-500/30]="recording()"
        [class.border-sky-400]="!recording()"
        [class.bg-sky-500/20]="!recording()"
        [class.text-sky-200]="!recording()"
        [class.hover:bg-sky-500/30]="!recording()"
        [disabled]="!recording() && !canStart()"
        (click)="toggle()"
      >
        {{ recording() ? 'Detener rodada' : 'Iniciar rodada' }}
      </button>
    </section>
  `,
})
export class RideControls {
  readonly recording = input.required<boolean>();
  readonly elapsedSeconds = input.required<number>();
  readonly canStart = input.required<boolean>();

  readonly start = output<void>();
  readonly stop = output<void>();

  protected toggle(): void {
    if (this.recording()) {
      this.stop.emit();
      return;
    }
    this.start.emit();
  }
}
