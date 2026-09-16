# Métricas posibles con el COOSPO BK467

El BK467 es un sensor de doble modo (cadencia o velocidad) que habla el perfil BLE estándar Cycling Speed and Cadence (CSC). Esto resume qué métricas se pueden obtener según el modo y qué no puede medir.

## Del modo cadencia (LED azul)

El sensor envía **revoluciones de biela + tiempo del último evento**. De ahí se derivan:

- **RPM actual / mín / máx / promedio** (ya implementado en la app)
- **Tiempo pedaleando vs. descanso** (coasting): % de tiempo con RPM > 0
- **Promedio solo en pedaleo** (excluyendo ceros; más útil que el promedio bruto)
- **Zonas de cadencia**: % de tiempo en rangos (p. ej. <60, 60–80, 80–100, >100 RPM)
- **Total de revoluciones de pedal** (conteo acumulado de la sesión)

## Del modo velocidad (LED rojo)

El BK467 también envía **revoluciones de rueda + tiempo**. Con eso más el **perímetro de la rueda** (configurable por el usuario, p. ej. 2,105 m para 700×25c):

- **Velocidad instantánea, promedio y máxima** (km/h)
- **Distancia total** (km)

> ⚠️ Una unidad BK467 mide cadencia **o** velocidad, no ambas a la vez. Para tener las dos simultáneamente se necesitan **dos sensores** (uno en cada modo). El parser de la app ya decodifica los datos de rueda (hoy solo los usa para el aviso de "modo velocidad"), así que soportar velocidad es una extensión natural.

## Lo que NO puede medir este sensor

| Métrica | Qué necesitarías |
|---|---|
| Potencia (watts) | Medidor de potencia (pedales/biela/plato) |
| Frecuencia cardíaca | Banda de pecho HR (BLE estándar, fácil de añadir) |
| GPS / elevación / ruta | Teléfono o ciclocomputador con GPS y barómetro |
| Calorías estimadas | Solo estimaciones muy burdas con tiempo + cadencia (poco fiables) |

## Próximos pasos sugeridos (por valor/esfuerzo)

1. **Tiempo en pedaleo + promedio en pedaleo** — solo extender las stats de la sesión (poco esfuerzo).
2. **Zonas de cadencia** en el historial/detalle de rodada.
3. **Soporte de velocidad/distancia** — nuevo modo con ajuste de perímetro de rueda (más trabajo: configuración, nueva vista o combinada con dos sensores).
