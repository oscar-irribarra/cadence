import { Component, input } from '@angular/core';
import { RideSession } from '../../../../core/domain/models/ride-session';
import { RideListItem } from '../ride-list-item/ride-list-item';

@Component({
  selector: 'app-ride-list',
  imports: [RideListItem],
  template: `
    @if (sessions().length === 0) {
      <div class="rounded-2xl border border-dashed border-zinc-800 px-6 py-14 text-center">
        <p class="text-sm text-zinc-500">Aún no hay rodadas registradas.</p>
        <p class="mt-1 text-xs text-zinc-600">
          Conecta el sensor e inicia una rodada para verla aquí.
        </p>
      </div>
    } @else {
      <ul class="flex flex-col gap-3">
        @for (session of sessions(); track session.id) {
          <li>
            <app-ride-list-item [session]="session" />
          </li>
        }
      </ul>
    }
  `,
})
export class RideList {
  readonly sessions = input.required<readonly RideSession[]>();
}
