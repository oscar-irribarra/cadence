import { Component, input } from '@angular/core';

@Component({
  selector: 'app-compatibility-banner',
  template: `
    @if (visible()) {
      <aside
        class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-200"
      >
        <p class="font-semibold">Bluetooth no disponible en este navegador</p>
        <p class="mt-1 leading-relaxed">
          En iPhone usa <strong>Bluefy</strong> o la extensión <strong>beacio</strong> para Safari.
          En escritorio o Android usa Chrome o Edge. La conexión requiere HTTPS.
        </p>
      </aside>
    }
  `,
})
export class CompatibilityBanner {
  readonly visible = input.required<boolean>();
}
