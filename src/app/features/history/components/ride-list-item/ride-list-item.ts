import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RideSession } from '../../../../core/domain/models/ride-session';
import { DurationPipe } from '../../../../shared/pipes/duration-pipe';

@Component({
  selector: 'app-ride-list-item',
  imports: [DatePipe, DurationPipe],
  template: `
    <article class="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <header class="flex items-baseline justify-between gap-3">
        <time class="text-sm text-zinc-300" [attr.datetime]="isoDate()">
          {{ session().startedAt | date: 'short' }}
        </time>
        <span class="font-mono text-sm text-zinc-500">
          {{ session().durationSeconds | duration }}
        </span>
      </header>

      <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt class="text-[11px] uppercase tracking-wide text-zinc-500">Mín</dt>
          <dd class="font-mono text-lg text-zinc-200">{{ session().rpmMin }}</dd>
        </div>
        <div>
          <dt class="text-[11px] uppercase tracking-wide text-zinc-500">Prom</dt>
          <dd class="font-mono text-lg text-zinc-200">{{ session().rpmAvg }}</dd>
        </div>
        <div>
          <dt class="text-[11px] uppercase tracking-wide text-zinc-500">Máx</dt>
          <dd class="font-mono text-lg text-zinc-200">{{ session().rpmMax }}</dd>
        </div>
      </dl>
    </article>
  `,
})
export class RideListItem {
  readonly session = input.required<RideSession>();

  protected readonly isoDate = computed(() => new Date(this.session().startedAt).toISOString());
}
