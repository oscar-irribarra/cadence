import { Component, inject, signal } from '@angular/core';
import { RideHistory } from '../../../core/application/ride-history';
import { RideList } from '../components/ride-list/ride-list';

@Component({
  selector: 'app-history-page',
  imports: [RideList],
  template: `
    <div class="flex flex-col gap-6">
      <header class="flex items-center justify-between gap-4">
        <h1 class="text-xl font-semibold text-zinc-100">Historial</h1>

        @if (history.sessions().length > 0) {
          @if (confirmingClear()) {
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-rose-400/60 px-3 py-1.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20"
                (click)="confirmClear()"
              >
                Confirmar
              </button>
              <button
                type="button"
                class="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800"
                (click)="cancelClear()"
              >
                Cancelar
              </button>
            </div>
          } @else {
            <button
              type="button"
              class="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800"
              (click)="requestClear()"
            >
              Borrar todo
            </button>
          }
        }
      </header>

      <app-ride-list [sessions]="history.sessions()" />
    </div>
  `,
})
export class HistoryPage {
  protected readonly history = inject(RideHistory);
  protected readonly confirmingClear = signal(false);

  protected requestClear(): void {
    this.confirmingClear.set(true);
  }

  protected cancelClear(): void {
    this.confirmingClear.set(false);
  }

  protected confirmClear(): void {
    this.history.clearAll();
    this.confirmingClear.set(false);
  }
}
