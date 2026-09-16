# Plan: Cadence — PWA de cadencia para COOSPO BK467

> Plan aprobado. Guardado el 2026-09-15. Ejecución manual por fases.
> Estado: ✅ Implementado (fases 1–10). Build de producción verde, 27 tests pasando, dev server con sensor simulado.

## 1. Visión general

PWA Angular 22 que conecta por Web Bluetooth con el sensor COOSPO BK467 (perfil BLE CSC estándar), muestra RPM en tiempo real en un medidor circular, permite grabar "rides" y consultar un historial con estadísticas básicas. Sin backend, sin auth, datos en el dispositivo.

## 2. Decisiones confirmadas

| # | Decisión | Elección final |
|---|---|---|
| 1 | Framework | **Angular 22.1** (standalone, OnPush y zoneless por defecto) |
| 2 | Lenguaje | **TypeScript ~6.0** (peer obligatorio de `@angular/compiler-cli@22`; TS 7 cuando Angular lo soporte) |
| 3 | Package manager | **pnpm 11.13.1** |
| 4 | Estilos | **Tailwind CSS v4** (`npx ng add tailwindcss`) |
| 5 | PWA | **@angular/pwa 22** (service worker solo activo en build de producción) |
| 6 | Tipos BLE | `@types/web-bluetooth` |
| 7 | Storage | **localStorage** detrás de `RideRepositoryPort` (intercambiable por IndexedDB en el futuro) |
| 8 | Medidor | Escala **0–200 RPM**; sin sensor conectado muestra **`--`** |
| 9 | Deploy | **Vercel** (HTTPS automático → compatible con Bluefy/beacio en iPhone) |
| 10 | Testing | Vitest (default del CLI 22); foco en parser BLE y cálculo de stats |

## 3. Restricciones de plataforma (iOS)

- Safari iOS **no soporta Web Bluetooth**. En iPhone la app funciona con:
  - **Bluefy** (navegador gratuito, App Store), o
  - **Safari + extensión beacio/iOSWebBLE** (gratuita, iOS 26.2+).
- Chrome/Edge en desktop y Android funcionan de forma nativa.
- Web Bluetooth exige **HTTPS** (localhost vale en desarrollo).
- La app debe detectar `navigator.bluetooth` al arranque y mostrar instrucciones si no existe.

## 4. Protocolo del sensor (verificado, Bluetooth SIG)

- **Servicio GATT:** `0x1816` (Cycling Speed and Cadence)
- **Característica:** `0x2A5B` (CSC Measurement, notify)
- **Payload:** byte 0 = flags; bit 1 → `crankRevolutions` (uint16 LE) + `lastCrankEventTime` (uint16 LE, unidades de 1/1024 s); bit 0 → datos de rueda (modo velocidad).
- **RPM** = `Δrevs / (Δtime / 1024) × 60`
- **Rollover uint16:** si el valor nuevo < anterior, sumar 65536 antes de restar.
- **Coasting:** sin evento en ~3 s → RPM = 0.
- **Modo del BK467:** una unidad mide cadencia O velocidad (no ambas). Cambio de modo reinstalando la batería: LED azul = cadencia, LED rojo = velocidad. Si solo llegan datos de rueda → avisar al usuario.
- Emparejar siempre desde la app (`requestDevice`), nunca desde ajustes Bluetooth del SO.

## 5. Arquitectura (Clean Architecture ligera + SOLID)

```
src/app/
├── core/
│   ├── domain/                      # Sin dependencias de Angular ni BLE
│   │   ├── models/
│   │   │   ├── csc-measurement.ts   # Paquete decodificado del sensor
│   │   │   └── ride-session.ts      # RideSession { id, startedAt, durationSeconds, rpmMin/Max/Avg }
│   │   └── ports/
│   │       ├── cadence-sensor.port.ts    # Interfaz: connect/disconnect/rpm (DIP)
│   │       └── ride-repository.port.ts   # Interfaz: save/getAll/clear + InjectionToken
│   ├── infrastructure/
│   │   ├── ble/
│   │   │   ├── csc-parser.ts             # Funciones PURAS: decode 0x2A5B + cálculo RPM
│   │   │   ├── web-bluetooth.adapter.ts  # Implementa CadenceSensorPort con Web Bluetooth
│   │   │   ├── mock-sensor.adapter.ts    # Simulador para desarrollo sin bici (dev only)
│   │   │   └── ble.tokens.ts             # InjectionToken CADENCE_SENSOR
│   │   └── storage/
│   │       └── local-storage-ride.repository.ts  # Implementa RideRepositoryPort
│   └── application/
│       ├── sensor-connection.service.ts  # signal<'disconnected'|'connecting'|'connected'|'error'>
│       └── ride-tracker.service.ts       # Grabación de sesión + stats (min/max/avg)
├── features/
│   ├── ride/
│   │   ├── ride.page.ts                  # Contenedor (orquesta, sin lógica)
│   │   └── components/
│   │       ├── sensor-connect.component.ts   # Botón conectar + badge estado
│   │       ├── rpm-gauge.component.ts        # Medidor circular SVG (0–200, '--' sin sensor)
│   │       └── ride-controls.component.ts    # Botón Start/Stop + tiempo transcurrido
│   └── history/
│       ├── history.page.ts
│       └── components/
│           ├── ride-list.component.ts
│           └── ride-list-item.component.ts
├── shared/
│   ├── components/bottom-nav.component.ts  # Menú flotante Ride | History
│   └── pipes/duration.pipe.ts              # mm:ss / h:mm:ss
├── app.routes.ts                       # /ride (default) y /history, lazy-loaded
└── app.config.ts
```

**Principios:**
- Puertos + adaptadores: el dominio define interfaces; Web Bluetooth y localStorage son detalles intercambiables (DIP/OCP).
- `csc-parser.ts` puro: testeable sin navegador ni sensor.
- Componentes pequeños, una sola responsabilidad, **inline templates** (solo `.ts`).
- Signals: `input()`/`output()`, `computed()`, control flow nativo `@if`/`@for`. Prohibido `ngClass`/`ngStyle` → usar bindings `class`/`style`.
- Servicios singleton con decorador `@Service` (Angular 22) e `inject()`.

**Provider intercambiable de storage:**
```ts
// app.config.ts
{ provide: RIDE_REPOSITORY, useClass: LocalStorageRideRepository }
// futuro: { provide: RIDE_REPOSITORY, useClass: IdbRideRepository }
```

## 6. Flujo del adaptador BLE

```ts
navigator.bluetooth.requestDevice({ filters: [{ services: [0x1816] }] })
  → gatt.connect()
  → getPrimaryService(0x1816)
  → getCharacteristic(0x2A5B)
  → startNotifications() + 'characteristicvaluechanged'
```

- **Mock adapter:** RPM sintéticos (60–100) para desarrollo sin hardware; se activa con flag de entorno.
- Estado visual del medidor: desconectado → `--` en gris, arco al 0%; conectado → RPM real, arco = `rpm / 200`.

## 7. UI (según boceto)

**Vista Ride (`/ride`):**
1. Arriba — `SensorConnectComponent`: botón "Connect Sensor" + badge de estado (punto verde/gris + nombre dispositivo). Sin `navigator.bluetooth` → panel con instrucciones (iOS: Bluefy/beacio; resto: Chrome/Edge).
2. Centro — `RpmGaugeComponent`: círculo SVG con `stroke-dashoffset` ∝ `rpm / 200`, número grande al centro, etiqueta "RPM". Accesible: `role="meter"` + `aria-valuenow`.
3. Abajo — `RideControlsComponent`: botón Start/Stop Ride + tiempo transcurrido.
4. Flotante — `BottomNavComponent`: tabs Ride | History con `routerLinkActive`, fijo abajo, safe-area iPhone.

**Vista History (`/history`):** lista de tarjetas con fecha, duración, RPM min/max/avg; estado vacío amigable; opción borrar historial.

**Diseño:** tema oscuro deportivo (acento verde/lima), números monoespaciados, layout `max-w-md` centrado tipo móvil.

## 8. Comandos iniciales (fase 1)

```bash
cd /home/kash/projects/cadence
ng new cadence --directory=. --package-manager=pnpm --style=css --routing \
  --ssr=false --ai-config=agents --interactive=false
npx ng add tailwindcss
npx ng add @angular/pwa
pnpm add -D @types/web-bluetooth
```

> `--ai-config=agents` genera un `AGENTS.md` base → completarlo en fase 10 con comandos pnpm, protocolo CSC y gotchas iOS.

## 9. Testing

| Qué | Cómo |
|---|---|
| `csc-parser` | Paquete cadencia, paquete velocidad, rollover de contadores, Δtime=0, coasting |
| Cálculo de stats | min/max/avg con muestras mock |
| Repositorio | Serialización en localStorage |
| Componentes | Smoke tests básicos |

## 10. Deploy (Vercel)

- `vercel.json` con rewrite SPA (`/(.*) → /index.html`) para que `/history` sobreviva recargas.
- Build: `pnpm build` → output `dist/cadence/browser`.
- El deploy de Vercel (HTTPS) es también la forma de validar PWA + Web Bluetooth en iPhone (Bluefy/beacio).

## 11. Fases de ejecución

1. **Scaffold** + pnpm + Tailwind + PWA + tipos BLE → `pnpm build` verde
2. **Dominio**: modelos + puertos
3. **Infraestructura**: parser puro (+ tests) → adapter Web Bluetooth → mock → repo localStorage
4. **Aplicación**: `SensorConnectionService` + `RideTrackerService`
5. **UI Ride**: connect → gauge (0–200, `--`) → controls → bottom-nav
6. **UI History**: lista + vacío + borrar
7. **Compatibilidad**: banner Web Bluetooth + aviso modo cadencia (LED azul)
8. **PWA final**: iconos, manifest, `theme-color`
9. **Verificación**: build, tests, dev server + `vercel.json`
10. **AGENTS.md** final con comandos y gotchas
