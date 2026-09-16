# Cadence — PWA de cadencia para COOSPO BK467

PWA Angular 22 (pnpm + Tailwind v4 + `@angular/pwa`) que lee cadencia (RPM) del sensor COOSPO BK467 por Web Bluetooth, graba rodadas y muestra historial.

## Comandos

- `pnpm start` — dev server. En desarrollo usa `MockCadenceSensor`; para probar con hardware real cambia `useMockSensor` en `src/environments/environment.development.ts` a `false`.
- `pnpm build` — build de producción → `dist/cadence/browser`. El service worker solo se activa en producción.
- `pnpm test` — Vitest (jsdom). Un solo archivo: `pnpm exec ng test --filter=<nombre del test>`.
- Deploy: Vercel (`vercel.json`, rewrite SPA). Web Bluetooth exige HTTPS (localhost vale en dev).

## Arquitectura

- `src/app/core/domain` — modelos y puertos; TypeScript puro, sin Angular.
- `src/app/core/infrastructure/ble` — `csc-parser.ts` y `rpm-calculator.ts` (puros), adaptador Web Bluetooth, `mock-sensor.adapter.ts`.
- `src/app/core/infrastructure/storage` — repositorio localStorage detrás del token `RIDE_REPOSITORY` (migrar a IndexedDB = nuevo adaptador + cambiar el provider).
- `src/app/core/application` — singletons con `@Service()`: `SensorConnection`, `RideTracker`, `RideHistory`.
- `src/app/features` — rutas lazy `/ride` y `/history`; `src/app/shared` — nav, banner de compatibilidad, pipe `duration`.
- Intercambio de implementaciones solo en `app.config.ts` (tokens `CADENCE_SENSOR` y `RIDE_REPOSITORY`).
- UI en español; componentes con template inline (solo `.ts`).

## Analytics

- `src/main.ts` inyecta Vercel Analytics y Speed Insights (`inject` / `injectSpeedInsights` del paquete vanilla). Solo recogen datos desplegados en Vercel y con las pestañas activadas en el panel del proyecto; en dev local corren en modo desarrollo (logs, sin envío).

## Protocolo BLE del BK467

- GATT: servicio `0x1816` (CSC), característica `0x2A5B` (notify).
- Payload: byte de flags; bit 0 → revoluciones de rueda (uint32) + tiempo (uint16); bit 1 → revoluciones de biela (uint16) + tiempo (uint16). Tiempos en unidades de 1/1024 s, little-endian.
- RPM = Δrevs / (Δtiempo/1024) × 60; los contadores dan la vuelta en 65536.
- Sin eventos de biela durante 3 s → RPM 0 (coasting).
- Una unidad mide velocidad O cadencia (se cambia reinstalando la batería; LED azul = cadencia). Si solo llegan datos de rueda se muestra el aviso de "modo velocidad".
- Emparejar siempre desde la app (`requestDevice`), nunca desde los ajustes Bluetooth del sistema.
- Tras conectar se lee el Device Information Service (`0x180A`: modelo `0x2A24`, fabricante `0x2A29`) para mostrar el nombre del sensor; es best-effort (si falla se usa el nombre Bluetooth).
- Al arrancar se intenta auto-conexión con `navigator.bluetooth.getDevices()` (Chrome/Edge, requiere autorización previa); sin `getDevices` se usa el botón.

## Gotchas de iOS

- Safari iOS no soporta Web Bluetooth. En iPhone usar **Bluefy** o la extensión **beacio/iOSWebBLE**; ambos requieren HTTPS.
- Los tipos de `@types/web-bluetooth` deben permanecer en `types` de `tsconfig.app.json` y `tsconfig.spec.json` (el CLI genera `"types": []`).

## Gotchas de pnpm

- pnpm 11 bloquea los build scripts de dependencias nativas (esbuild, lmdb, etc.) y en CI/Vercel falla con `ERR_PNPM_IGNORED_BUILDS`. Los permitidos se declaran en `pnpm-workspace.yaml` con `allowBuilds:` (el campo `pnpm` de package.json ya no se lee en pnpm 11).

## Gotchas de tests

- Node 26 define un `globalThis.localStorage` experimental que devuelve `undefined` y eclipsa el de jsdom; los specs deben stubearlo con `vi.stubGlobal` (ver `local-storage-ride.repository.spec.ts`).

---

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
