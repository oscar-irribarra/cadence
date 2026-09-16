import { Component, computed, input, output } from '@angular/core';
import { SensorConnectionState } from '../../../../core/domain/models/sensor-connection';

@Component({
  selector: 'app-sensor-connect',
  template: `
    <section class="flex flex-col items-center gap-3">
      <button
        type="button"
        class="w-full rounded-2xl border px-6 py-4 text-lg font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        [class.border-rose-400]="connected()"
        [class.bg-rose-500/15]="connected()"
        [class.text-rose-300]="connected()"
        [class.hover:bg-rose-500/25]="connected()"
        [class.border-zinc-700]="!connected()"
        [class.bg-zinc-800]="!connected()"
        [class.text-zinc-100]="!connected()"
        [class.hover:bg-zinc-700]="!connected()"
        [disabled]="connecting()"
        (click)="toggle()"
      >
        {{ buttonLabel() }}
      </button>

      <div class="flex items-center gap-2 text-sm" role="status" aria-live="polite">
        <span
          class="h-2.5 w-2.5 rounded-full"
          [class.bg-emerald-400]="connected()"
          [class.bg-amber-400]="connecting()"
          [class.bg-rose-500]="errored()"
          [class.bg-zinc-600]="disconnected()"
        ></span>
        <span
          [class.text-emerald-300]="connected()"
          [class.text-amber-300]="connecting()"
          [class.text-rose-300]="errored()"
          [class.text-zinc-400]="disconnected()"
        >
          {{ statusLabel() }}
        </span>
      </div>

      @if (notice(); as message) {
        <p class="w-full rounded-xl bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-300">
          {{ message }}
        </p>
      }
    </section>
  `,
})
export class SensorConnect {
  readonly state = input.required<SensorConnectionState>();
  readonly deviceName = input<string | null>(null);
  readonly notice = input<string | null>(null);

  readonly connect = output<void>();
  readonly disconnect = output<void>();

  protected readonly connected = computed(() => this.state() === 'connected');
  protected readonly connecting = computed(() => this.state() === 'connecting');
  protected readonly errored = computed(() => this.state() === 'error');
  protected readonly disconnected = computed(() => this.state() === 'disconnected');

  protected readonly buttonLabel = computed(() => {
    if (this.connecting()) {
      return 'Conectando…';
    }
    if (this.connected()) {
      return 'Desconectar';
    }
    if (this.errored()) {
      return 'Reintentar';
    }
    return 'Conectar sensor';
  });

  protected readonly statusLabel = computed(() => {
    if (this.connecting()) {
      return 'Conectando…';
    }
    if (this.connected()) {
      return this.deviceName() ?? 'Sensor conectado';
    }
    if (this.errored()) {
      return 'Error de conexión';
    }
    return 'Sensor desconectado';
  });

  protected toggle(): void {
    if (this.connected()) {
      this.disconnect.emit();
      return;
    }
    this.connect.emit();
  }
}
