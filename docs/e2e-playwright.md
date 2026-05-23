# E2E Playwright mockeado

Esta suite valida navegación, permisos visuales, responsividad y flujos operativos rápidos del frontend con API mockeada. No levanta PostgreSQL ni API real; por eso debe mantenerse separada del E2E integrado.

## Comandos

Desde la raíz:

```bash
npm run web:e2e:list
npm run web:e2e
```

Desde `apps/web`:

```bash
npm run e2e
npm run e2e:ui
npm run playwright:install
```

## Alcance actual

La suite mockeada cubre:

- login de admin;
- navegación administrativa;
- bloqueo visual y por ruta directa para vendedor;
- navegación móvil operativa;
- carga de Productos con búsqueda por SKU;
- carga de Inventario con existencias visibles;
- venta en efectivo reportada por vendedor sin depender de caja abierta.

## Diferencia contra E2E integrado

`npm run web:e2e` usa mocks HTTP y debe ejecutar solo specs en `apps/web/e2e/*.spec.ts`.

`npm run web:e2e:integration` usa backend real y PostgreSQL real, y debe ejecutar solo `apps/web/e2e/integration/**` mediante `playwright.integration.config.ts`.

Si `web:e2e` lista archivos de `e2e/integration`, revisa `apps/web/playwright.config.ts`. Si Vitest intenta ejecutar specs Playwright, revisa `apps/web/vitest.config.ts`.

## Criterio de diseño

- Preferir selectores accesibles: `getByRole`, `getByLabel`, `getByText` con texto estable.
- Evitar validar texto oculto por layouts responsive o variantes móvil/desktop duplicadas.
- Si un dato existe en DOM pero Playwright lo marca `hidden`, revisar el layout antes de endurecer el selector.
- Los mocks deben representar permisos reales del backend para evitar falsos positivos.

## Cuándo agregar casos aquí

Agrega casos mockeados cuando el cambio afecte:

- navegación;
- permisos visibles;
- responsive;
- formularios críticos;
- estados vacíos/error/carga;
- flujo UX que no necesita persistencia real.

Si el caso requiere verificar inventario real, transacciones, reportes o migraciones, agrégalo al E2E integrado en `docs/e2e-integration.md`.
