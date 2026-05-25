# Punta Venta — Diagnóstico frontend post-cobertura

Fecha de referencia: posterior a Patch 65.

Este documento registra la deuda frontend observable después de ampliar la cobertura E2E funcional y estabilizar selectores con `data-testid`. No propone cambios masivos inmediatos. Su objetivo es definir un orden seguro para optimizar y refactorizar la capa web sin perder cobertura ni introducir regresiones visuales.

## 1. Estado actual

La cobertura funcional mockeada ya cubre flujos críticos por módulo:

- autenticación y navegación por rol;
- ventas con efectivo sin caja abierta;
- bloqueo de pago insuficiente;
- productos: creación, desactivación y eliminación;
- inventario: entradas, salidas e historial;
- usuarios: creación, rol, reset de contraseña y activación/desactivación;
- reportes, auditoría y actividad de vendedores;
- caja y permisos;
- selectores E2E endurecidos con `data-testid` en controles críticos.

La cobertura integrada real ya valida venta y eliminación física con historial preservado. Esto habilita refactors frontend más seguros, pero todavía conviene hacerlos por pantalla y con alcance pequeño.

## 2. Páginas y archivos grandes

Tamaño aproximado actual por archivo relevante:

| Archivo | Líneas aproximadas | Riesgo |
| --- | ---: | --- |
| `apps/web/src/pages/SalesPage.tsx` | 1167 | Alto |
| `apps/web/src/pages/ReportsPage.tsx` | 708 | Medio-alto |
| `apps/web/src/pages/ProductsPage.tsx` | 705 | Medio-alto |
| `apps/web/src/pages/UsersPage.tsx` | 672 | Medio |
| `apps/web/src/pages/products/productShared.tsx` | 517 | Medio |
| `apps/web/src/pages/CashRegisterPage.tsx` | 508 | Medio |
| `apps/web/src/pages/inventory/inventoryShared.tsx` | 500 | Medio |
| `apps/web/src/pages/InventoryPage.tsx` | 445 | Medio |
| `apps/web/src/pages/audit/auditShared.tsx` | 429 | Bajo-medio |
| `apps/web/src/pages/SellerActivityPage.tsx` | 414 | Bajo-medio |

`SalesPage.tsx` sigue siendo el candidato principal para extracción futura. Aun así, no debe refactorizarse en bloque. Debe dividirse por hooks/componentes pequeños con E2E pasando entre cada patch.

## 3. Riesgos de bundle

El build histórico mostró chunks grandes:

- `DataGridCard`: alrededor de 403 kB sin gzip;
- `index`: alrededor de 508 kB sin gzip.

Estos tamaños no bloquean desarrollo local, pero sí justifican revisar:

- imports de Material UI;
- lazy loading de páginas;
- carga diferida de componentes pesados de tablas;
- separación de vistas administrativas que no necesita el vendedor;
- evitar que componentes compartidos arrastren dependencias pesadas a rutas simples.

No conviene optimizar bundle a ciegas. Primero debe agregarse una medición reproducible.

## 4. Regla para próximos refactors frontend

Todo refactor frontend debe cumplir:

1. No cambiar contratos API.
2. No cambiar permisos ni navegación por rol.
3. No mover lógica de negocio a componentes visuales.
4. Mantener `data-testid` existentes o migrarlos con update E2E en el mismo patch.
5. Evitar `getByText` global en E2E si el texto puede repetirse.
6. Usar locators scoped por diálogo, sección, fila o test id.
7. No usar `force: true` salvo justificación explícita.
8. Correr `npm run web:e2e`, `npm run web:build` y `npm run web:test` después de cada patch.

## 5. Orden recomendado

### Patch 67 — Medición y guardrail de bundle

Agregar un script no bloqueante para medir tamaño de build y detectar chunks grandes. No debe fallar CI todavía si no hay acuerdo de presupuesto.

Objetivo:

- obtener una salida legible de chunks generados por Vite;
- documentar umbrales iniciales en `docs/architecture/frontend-bundle-guardrails.md`;
- ejecutar `npm run web:build && node scripts/web/audit-bundle.js` después de cambios frontend relevantes;
- preparar una futura decisión de code splitting.

### Patch 68 — Code splitting seguro de vendors

Las rutas principales ya usan `React.lazy` en `apps/web/src/App.tsx`. Por eso el siguiente paso seguro no es duplicar lazy loading, sino separar vendors pesados en `apps/web/vite.config.ts`:

- React/React Router;
- Material UI y Emotion;
- MUI X DataGrid;
- iconos MUI;
- Axios;
- resto de dependencias.

Debe conservar protección de rutas y navegación por permisos. Validar especialmente login, refresh, rutas directas y salida de `node scripts/web/audit-bundle.js`.

### Patch 69 — Refactor frontend puntual

Elegir una sola pantalla. Prioridad recomendada: `SalesPage.tsx`.

Extracciones candidatas:

- hook de estado de carrito;
- hook de pago/cambio;
- componente de selector de producto;
- componente de resumen de venta;
- componente de historial/acciones de venta.

No extraer todo en un solo patch.

### Patch 70 — Cierre de ronda y continuidad

Generar documentación de cierre:

- patches aplicados;
- validaciones ejecutadas;
- estado Git esperado;
- comandos de diagnóstico;
- siguiente plan recomendado;
- mensaje compacto para iniciar chat nuevo.

## 6. Checklist antes de modificar UI grande

Antes de tocar `SalesPage.tsx`, `ProductsPage.tsx` o `ReportsPage.tsx`:

```bash
npm run web:e2e
npm run web:build
npm run web:test
```

Después de aplicar el patch:

```bash
npm run web:e2e
npm run web:build
npm run web:test
npm run api:test:critical
```

Si el cambio toca rutas, auth o permisos:

```bash
npm run web:e2e:integration
```

## 7. Señales de alto riesgo

Detener el refactor si aparece alguno de estos casos:

- se necesitan cambios simultáneos en más de una página grande;
- se rompe navegación por rol;
- se pierden `data-testid` ya usados por E2E;
- se cambia el payload enviado al backend;
- se requiere tocar API para compensar una extracción visual;
- aparecen locators frágiles nuevos en tests.

## 8. Criterio de cierre de frontend

La ronda frontend puede considerarse estable cuando:

- `web:e2e` pasa con cobertura mockeada por módulos;
- `web:e2e:integration` pasa para flujo real de venta e historial;
- `web:build` pasa sin errores TypeScript;
- no hay patches pendientes que mezclen UI, API y schema;
- la documentación de continuidad refleja el estado real del repo.
