# Cadence — PWA de cadencia para COOSPO BK467

PWA en Angular que se conecta por Web Bluetooth al sensor **COOSPO BK467** para mostrar tu cadencia (RPM) en tiempo real, grabar rodadas y consultar un historial con estadísticas básicas.

## Características

- Conexión al sensor BLE con un toque (perfil estándar Cycling Speed and Cadence).
- Medidor circular de RPM en tiempo real (escala 0–200 RPM).
- Grabación de rodadas: RPM mínima, máxima, promedio y duración.
- Historial de rodadas guardado en el dispositivo (localStorage).
- Aviso cuando el sensor está en modo velocidad (LED rojo) en lugar de cadencia.
- PWA instalable con service worker para uso offline de la interfaz.

## Stack

- Angular 22 (standalone, signals, zoneless) + TypeScript 6
- Tailwind CSS v4
- pnpm
- Vitest para tests unitarios
- `@angular/pwa` para el service worker y manifest
- Deploy en Vercel

## Empezar

```bash
pnpm install
pnpm start
```

Abre `http://localhost:4200`. En desarrollo se usa un **sensor simulado** (`MockCadenceSensor`) que emite RPM sintéticos, ideal para probar la UI sin hardware.

Para probar con el sensor real en desarrollo, cambia `useMockSensor` a `false` en `src/environments/environment.development.ts` y usa Chrome o Edge.

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm start` | Servidor de desarrollo en `http://localhost:4200` |
| `pnpm build` | Build de producción → `dist/cadence/browser` (el service worker solo se activa en producción) |
| `pnpm test` | Tests unitarios con Vitest |
| `pnpm exec ng test --filter=<nombre>` | Ejecutar un solo test |

## Uso con el sensor BK467

1. Instala el sensor en la **biela** (modo cadencia). Al reinstalar la batería, el **LED azul** confirma el modo cadencia (rojo = velocidad).
2. Pulsa **Conectar sensor** y elige el BK467 en el diálogo del navegador. Empareja siempre desde la app, nunca desde los ajustes Bluetooth del sistema.
3. Pulsa **Iniciar rodada** para grabar; al detenerla se guarda en el historial (se guardan solo las rodadas con muestras de cadencia).

> Una unidad BK467 mide velocidad **o** cadencia, no ambas a la vez. Si necesitas las dos, usa dos sensores.

## Compatibilidad

| Plataforma | Navegador | Estado |
| --- | --- | --- |
| Android | Chrome | ✅ |
| Escritorio | Chrome, Edge, Opera | ✅ |
| iPhone / iPad | **Bluefy** o Safari + extensión **beacio** | ✅ |
| iPhone / iPad | Safari sin extensión | ❌ (iOS no soporta Web Bluetooth) |

Web Bluetooth requiere **HTTPS** (localhost vale en desarrollo). La forma recomendada de probar en iPhone es desplegar en Vercel y abrir la URL con Bluefy o Safari + beacio.

## Deploy

El proyecto está configurado para [Vercel](https://vercel.com) mediante `vercel.json` (rewrite SPA incluido):

```bash
pnpm build   # salida en dist/cadence/browser
```

Vercel detecta pnpm automáticamente; el deploy provee HTTPS, requisito de Web Bluetooth.

## Arquitectura

```
src/app/
├── core/
│   ├── domain/            # Modelos y puertos (TypeScript puro, sin Angular)
│   ├── infrastructure/    # Adaptadores: BLE (Web Bluetooth, mock) y storage (localStorage)
│   └── application/       # Servicios de estado con signals (@Service)
├── features/              # Rutas lazy: /ride y /history
└── shared/                # Nav, banner de compatibilidad, pipe duration
```

- Las implementaciones se intercambian en `app.config.ts` mediante los tokens `CADENCE_SENSOR` y `RIDE_REPOSITORY`.
- Para migrar el almacenamiento a IndexedDB basta crear un nuevo adaptador que implemente `RideRepository` y cambiar el provider.

## Referencias

- [Protocolo del sensor (BLE CSC)](https://www.bluetooth.com/specifications/specs/cycling-speed-and-cadence-profile/) — servicio `0x1816`, característica `0x2A5B`.
- [Web Bluetooth API](https://developer.mozilla.org/es/docs/Web/API/Web_Bluetooth_API)
- [Angular](https://angular.dev)
