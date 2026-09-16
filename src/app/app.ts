import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNav } from './shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNav],
  template: `
    <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-8 pb-40">
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
    <app-bottom-nav />
  `,
})
export class App {}
