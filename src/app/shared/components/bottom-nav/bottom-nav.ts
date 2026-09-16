import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      aria-label="Navegación principal"
    >
      <div
        class="grid grid-cols-2 gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-1 backdrop-blur"
      >
        <a
          routerLink="/ride"
          routerLinkActive="bg-zinc-800 text-zinc-50"
          ariaCurrentWhenActive="page"
          class="rounded-xl px-4 py-3 text-center text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
        >
          Rodada
        </a>
        <a
          routerLink="/history"
          routerLinkActive="bg-zinc-800 text-zinc-50"
          ariaCurrentWhenActive="page"
          class="rounded-xl px-4 py-3 text-center text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
        >
          Historial
        </a>
      </div>
    </nav>
  `,
})
export class BottomNav {}
