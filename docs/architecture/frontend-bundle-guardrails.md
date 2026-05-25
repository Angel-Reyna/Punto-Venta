# Punta Venta — Guardrails de bundle frontend

Fecha de referencia: posterior a Patch 66.

Este documento define cómo medir el tamaño del build web sin bloquear todavía el flujo de desarrollo. El objetivo es detectar crecimiento de chunks antes de aplicar optimizaciones como lazy loading o separación de componentes pesados.

## 1. Script disponible

Después de generar el build web:

```bash
npm run web:build
node scripts/web/audit-bundle.js
```

También puede ejecutarse en un solo paso:

```bash
npm run web:build && node scripts/web/audit-bundle.js
```

El script analiza `apps/web/dist/assets`, calcula tamaño raw y gzip de chunks `.js` y `.css`, y muestra una tabla ordenada de mayor a menor tamaño.

## 2. Modo no bloqueante por defecto

Por defecto, `node scripts/web/audit-bundle.js` es informativo. Puede mostrar `WARN` o `FAIL`, pero solo falla el proceso si se activa modo estricto.

Esto evita romper el flujo actual mientras todavía no existe un presupuesto definitivo de performance.

## 3. Umbrales iniciales

Valores por defecto:

| Métrica | WARN | FAIL |
| --- | ---: | ---: |
| Chunk individual raw | 350 kB | 550 kB |
| JS total raw | 1200 kB | 1800 kB |

Estos umbrales son iniciales. Deben ajustarse con datos reales después de medir builds locales y de producción.

## 4. Variables de entorno

El script acepta variables para ajustar umbrales:

```bash
BUNDLE_AUDIT_WARN_CHUNK_KB=300 \
BUNDLE_AUDIT_FAIL_CHUNK_KB=500 \
BUNDLE_AUDIT_WARN_TOTAL_JS_KB=1000 \
BUNDLE_AUDIT_FAIL_TOTAL_JS_KB=1600 \
node scripts/web/audit-bundle.js
```

Para convertir fallos de presupuesto en error de proceso:

```bash
BUNDLE_AUDIT_STRICT=true node scripts/web/audit-bundle.js
```

En Windows PowerShell:

```powershell
$env:BUNDLE_AUDIT_STRICT="true"
node scripts/web/audit-bundle.js
Remove-Item Env:BUNDLE_AUDIT_STRICT
```

## 5. Interpretación

- `OK`: tamaño dentro del presupuesto inicial.
- `WARN`: no bloquea, pero conviene revisar antes de seguir agregando UI pesada.
- `FAIL`: excede el presupuesto de referencia. En modo no estricto no rompe el proceso, pero debe tratarse como deuda visible.

Si aparecen chunks grandes como `DataGridCard` o `index`, revisar primero:

- imports de Material UI;
- lazy loading de rutas administrativas;
- componentes compartidos que arrastran dependencias pesadas;
- DataGrid usado en vistas simples donde una tabla/tarjeta ligera sea suficiente;
- imports de iconos agregados desde barrels amplios.

## 6. Criterio para Patch 68

Patch 68 solo debería tocar code splitting si la auditoría confirma chunks grandes o crecimiento relevante.

Prioridad sugerida:

1. lazy loading de páginas por ruta;
2. fallback de carga simple;
3. conservar protección de rutas y permisos;
4. validar navegación directa por URL;
5. no mezclar code splitting con rediseños de pantalla.

Validación mínima para Patch 68:

```bash
npm run web:e2e
npm run web:build && node scripts/web/audit-bundle.js
npm run web:test
npm run api:test:critical
```

Si el cambio toca rutas protegidas o auth:

```bash
npm run web:e2e:integration
```
