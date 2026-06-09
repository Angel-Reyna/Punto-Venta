# Punta Venta — Checklist de cierre visual responsive

Este checklist cierra la ronda visual responsive aplicada después del checkpoint funcional estable. Su objetivo es confirmar que los cambios de UI quedaron mantenibles, probados y sin deuda oculta antes de volver a features, seguridad o performance backend.

## Alcance de la ronda

La ronda visual incluye:

- modo noche y shell visual general;
- rediseño responsive de Auditoría, Inicio, Productos, Inventario, Ventas, Reportes, Usuarios, Actividad de vendedores, Control de efectivo retirado y Login;
- correcciones de paneles laterales estrechos;
- estabilización de selectores E2E integrados con `data-testid` y locators scoped;
- estabilización de chunks Vite para eliminar el warning circular entre `vendor` y `vendor-mui-core`;
- consolidación inicial de layouts laterales y cards métricas compartidas.

No debe considerarse una ronda de features. No cambió contratos HTTP, Prisma, permisos, auth ni reglas de negocio.

## Validación automatizada obligatoria

Desde la raíz del repo:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run clean:generated
npm run ci:validate-lockfiles
npm run api:prisma:validate
npm run api:build
npm run api:test:critical
npm run web:lint
npm run web:build
node scripts/web/audit-bundle.js
npm run web:test
npm run web:e2e
npm run web:e2e:integration
npm run docker:config
npm run docker:build
```

Criterios de aceptación:

- `git status --short --untracked-files=all` queda limpio después de limpiar generados.
- `git diff --check` no reporta whitespace ni conflictos.
- `web:e2e` pasa 18/18.
- `web:e2e:integration` pasa 2/2.
- `docker:build` pasa para API y Web.
- `node scripts/web/audit-bundle.js` puede quedar en `WARN` por JS total, pero no debe llegar a `FAIL`.
- El build web no debe volver a mostrar el warning circular `vendor -> vendor-mui-core -> vendor`.

## Revisión manual por dispositivo

Probar en DevTools con estos tamaños mínimos:

| Perfil | Tamaño sugerido | Qué confirmar |
| --- | ---: | --- |
| Móvil | 390 x 844 | Sin scroll horizontal; cards legibles; acciones tocables; filtros en una columna. |
| Tablet | 768 x 1024 | Layout de dos columnas solo cuando haya espacio real; sidebars sin campos aplastados. |
| Laptop | 1366 x 768 | Paneles sticky no tapan contenido; headers no se superponen; tablas no fuerzan overflow. |
| Desktop | 1440 x 900 | Jerarquía visual clara; panel principal y lateral balanceados; métricas alineadas. |

## Revisión manual por módulo

| Módulo | Punto crítico de revisión | Resultado esperado |
| --- | --- | --- |
| Login | Alternar modo noche/día antes de iniciar sesión. | El formulario sigue centrado y accesible en móvil; el panel informativo no estorba en desktop. |
| Inicio | Resumen operativo por rol. | No reaparecen acciones rápidas duplicadas ni lenguaje de control de efectivo retirado obligatoria. |
| Productos | Búsqueda, cards, acciones admin y estados. | SKU/estado/precio se entienden sin depender solo de color; vendedor no ve acciones admin. |
| Inventario | Existencias, alertas, ajustes e historial. | Los items tienen contenedor estable y no dependen de jerarquía DOM frágil para pruebas. |
| Ventas | Catálogo, ticket y cobro. | El SKU puede aparecer en catálogo y ticket sin romper E2E; el test debe scoped al ticket. |
| Reportes | Panel lateral y detalle. | Controles y resumen conservan textos E2E; el layout lateral no aplasta filtros. |
| Usuarios | Crear usuario y filtros. | Formularios dentro de sidebar usan una columna; no hay campos cortados. |
| Actividad de vendedores | Filtros laterales y timeline. | Fechas, botones y búsqueda no se comprimen en pantallas anchas con sidebar estrecho. |
| Control de efectivo retirado | Estado, apertura/cierre y movimientos. | Comunica control de efectivo, no requisito para vender. |
| Auditoría | Filtros y eventos. | Eventos son entendibles y mantienen actor, entidad, severidad y cambios. |

## Riesgos que deben vigilarse en próximos patches

- No usar `page.getByText(sku)` global en ventas o inventario cuando el SKU puede aparecer en más de una zona. Usar `getByTestId("sales-cart-items")` o un contenedor scoped.
- No navegar el DOM con `locator("..")` para ubicar cards. Agregar `data-testid` estable al contenedor.
- No definir grids por viewport dentro de paneles laterales estrechos. En sidebars, preferir una columna fija.
- No añadir más UI pesada antes de revisar si el bundle sigue en `WARN`.
- No cambiar textos usados como anclas E2E sin actualizar pruebas de forma scoped y justificada.

## Cierre de ronda

Al cerrar la ronda visual:

```bash
npm run clean:generated
git status --short --untracked-files=all
git diff --check
npm run project:snapshot:qa
```

No ejecutar `npm run clean:generated` después del snapshot, porque eliminaría `.puntaventa_diagnostics`.

## Siguiente etapa recomendada

Después de esta ronda visual, no seguir agregando rediseños salvo bugs concretos. Priorizar una de estas etapas:

1. Seguridad: persistencia/revocación robusta de refresh sessions y revisión de cookies/CSRF.
2. Performance: optimización Prisma, índices y consultas críticas.
3. CI/CD: pipeline de deploy y validación de Docker/producción.
4. Producto: features nuevas bien delimitadas, una por patch.
