# Checklist de release smoke — Punta Venta

Este checklist valida que Punta Venta está lista para una entrega local o despliegue interno después de una ronda de patches visuales, QA o seguridad. No reemplaza la suite automatizada; complementa lo que Playwright no puede evaluar bien: claridad visual, accesibilidad básica, descarga real de archivos y experiencia responsive. Para el cierre específico de la ronda visual responsive, usar además `docs/qa/visual-release-checklist.md`.

## Alcance

Ejecuta este checklist cuando se cumpla cualquiera de estas condiciones:

- se rediseñó un módulo visible;
- se tocaron ventas, productos, inventario, reportes, auditoría, usuarios o control de efectivo retirado;
- se actualizaron dependencias de seguridad;
- se cerrará una ronda grande de patches;
- se va a crear un snapshot de continuidad o tag interno.

## Preflight técnico

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

git status --short
npm run clean:generated
npm run qa:full
```

Criterios:

- `git status --short` queda limpio antes de iniciar la revisión manual.
- `qa:full` pasa completo: guardrails, Prisma, API build, API tests críticos, Vitest, build web, bundle audit, E2E mockeado, E2E integrado, Docker config y Docker build.
- `node scripts/web/audit-bundle.js --strict` queda dentro de umbrales de fallo. El warning circular `vendor -> vendor-mui-core -> vendor` no debe reaparecer; quedó corregido mediante la estabilización de chunks del build web.

## Smoke ADMIN

| Módulo | Verificación manual | Resultado esperado |
| --- | --- | --- |
| Inicio | Abrir `/` como admin. | Se ve un resumen operativo claro, sin acciones rápidas duplicadas ni dependencia visual de control de efectivo retirado para vender. |
| Productos | Buscar por SKU, crear producto, desactivar y revisar tarjeta. | La búsqueda es clara, los estados activo/inactivo no son ambiguos y las acciones admin están visibles solo para admin. |
| Inventario | Revisar existencias y registrar entrada/salida. | Stock, alertas y timeline/historial son legibles en desktop y móvil. |
| Nueva venta | Buscar producto, usar Enter con texto parcial y con SKU exacto, crear venta. | Enter no agrega el primer producto con búsqueda parcial; solo agrega coincidencia exacta. |
| Reportes | Consultar periodo con ventas y descargar PDF. | KPIs y productos vendidos netos son claros; PDF corresponde al criterio visible. |
| Usuarios | Crear vendedor, cambiar rol, resetear contraseña y desactivar. | El estado y rol del usuario se entienden sin depender solo del color. |
| Auditoría | Filtrar por texto/evento crítico. | El timeline permite identificar actor, entidad, severidad y antes/después. |
| Actividad de vendedores | Filtrar por acción, búsqueda local y auto-refresh. | La actividad es escaneable como timeline y los filtros activos se entienden. |
| Control de efectivo retirado | Abrir/cerrar control de efectivo retirado y registrar movimiento manual. | Control de efectivo retirado comunica control de efectivo, pero no se interpreta como requisito para vender. |

## Smoke VENDEDOR

| Módulo | Verificación manual | Resultado esperado |
| --- | --- | --- |
| Inicio | Login como vendedor. | Solo ve accesos operativos permitidos. |
| Productos | Revisar catálogo. | No ve costo, margen, importación, toggle ni eliminación. |
| Inventario | Revisar existencias. | No ve controles de ajuste ni acciones administrativas. |
| Nueva venta | Registrar venta en efectivo. | La venta se registra sin control de efectivo retirado abierta. |
| Rutas admin directas | Navegar manualmente a `/users`, `/reports`, `/audit`, `/seller-activity`. | Acceso bloqueado y sin fuga de datos administrativos. |

## Responsive visual mínimo

Probar cada módulo en estos tamaños aproximados desde DevTools:

- móvil: 390 x 844;
- tablet: 768 x 1024;
- laptop: 1366 x 768;
- desktop: 1440 x 900.

Criterios:

- no hay scroll horizontal innecesario en páginas principales;
- tarjetas y timelines mantienen jerarquía visual;
- botones críticos son tocables en móvil;
- filtros no quedan ocultos debajo de headers o drawers;
- textos largos no rompen cards ni chips;
- cada módulo conserva un `h1` visible.

## Descargas e importación reales

Validar en navegador real, no solo en mocks:

1. Descargar formato Excel desde Productos.
2. Abrir el archivo generado y confirmar encabezados.
3. Importar un Excel válido con al menos dos productos.
4. Importar un Excel inválido y confirmar mensaje accionable.
5. Descargar PDF de Reportes y abrirlo.
6. Confirmar que Excel/PDF no quedan versionados en Git.

## Cierre

```bash
npm run clean:generated
git status --short
git diff --check
```

Criterios de cierre:

- no quedan `dist`, `test-results`, `playwright-report`, traces, videos, screenshots, Excel/PDF descargados ni diagnósticos temporales pendientes de commit;
- si la ronda se cierra o cambia de chat, generar snapshot con:

```bash
bash scripts/project/create-continuity-snapshot.sh --with-qa
```
