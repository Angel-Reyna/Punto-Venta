# Punta Venta — Continuidad para nuevo chat

Fecha de corte recomendada: generar al cerrar una ronda de patches.
Ruta local habitual: `C:\Users\drago\Proyectos\Punta_Venta`.
Shell habitual: Git Bash en Windows.

Este archivo sirve para cambiar a un chat nuevo sin perder contexto técnico. El repositorio Git y el snapshot generado son la fuente de verdad; el chat solo debe reconstruir el estado desde esos archivos.

## 1. Cuándo abrir un nuevo chat

Abre un chat nuevo cuando ocurra cualquiera de estas condiciones:

- El chat actual empieza a responder lento.
- Ya hay muchos patches/logs en el hilo.
- Se cerró una ronda grande de trabajo.
- Se aplicaron refactors importantes.
- Vas a iniciar una etapa distinta del proyecto.
- Vas a adjuntar un snapshot nuevo del repo.

No sigas acumulando patches largos en un chat degradado si vas a tocar Auth, Prisma, ventas, inventario, reportes, Docker o E2E integrado.

## 2. Estado funcional que debe preservarse

Punta Venta no debe tratarse como POS clásico con control de efectivo retirado obligatoria.

Modelo correcto:

- Admin/dueño gestiona productos, inventario, usuarios, reportes, auditoría y actividad.
- Vendedores registran ventas físicas en la app.
- La venta en efectivo no debe depender de control de efectivo retirado abierta.
- `CASHIER` se conserva como enum técnico, pero en UI/documentación debe tratarse como `Vendedor`.
- Control de efectivo retirado queda como módulo secundario; no debe bloquear ventas.

## 3. Estado de patches al cierre de esta ronda

Aplicados y validados durante la ronda principal de estabilización histórica:

- Patches 50a-70: cobertura E2E/API, auditoría operativa, actividad de vendedores con auto-refresh, eliminación física de productos con historial preservado, refactor backend modular, documentación de arquitectura, guardrails de bundle y guardrails de calidad para patches.
- Patches 120-122: extracción y endurecimiento del módulo Productos en frontend, importación, catálogo y acciones responsive.
- Patches 123-125: finalización del módulo Inventario en frontend, hook de datos, formulario de ajustes, secciones de stock y timeline de movimientos.
- Patch 126: finalización de Reportes en frontend con controles, resumen, detalle y API client dedicado.
- Patch 127 + 127a: finalización de Usuarios en frontend y estabilización de accesibilidad E2E.
- Patch 128: finalización de Auditoría y Actividad de vendedores en frontend.
- Patch 129: limpieza de Control de efectivo retirado/control de efectivo e Inicio/Dashboard, manteniendo venta sin dependencia de control de efectivo retirado abierta.
- Patch 130: checkpoint de estado 1.
- Patch 131: contratos HTTP frontend centralizados.
- Patch 132: cleanup backend de módulos core: productos, inventario y ventas.
- Patch 133: cleanup backend de módulos administrativos/reporting: reportes, dashboard, usuarios, actividad de vendedores y control de efectivo retirado.
- Patch 134: checkpoint de estado 2.
- Patch 135: costos históricos y utilidad bruta en ventas, devoluciones, reportes y PDF.
- Patch 136 + 136a + 136b: redacción de datos sensibles en auditoría/actividad y serialización segura de payloads JSON.
- Patch 137: factories reutilizables para E2E mockeado e integrado.
- Patch 138: checkpoint de estado 3.
- Patch 139: limpieza final de warnings frontend, logs de checkpoint y guardrails de artefactos.
- Patch 140: auditoría final contra el plan inicial y actualización de documentación de cierre.

Estado esperado al cerrar Patch 140:

- `git diff --check` limpio.
- `npm run qa:full` en verde.
- `node scripts/web/audit-bundle.js` sin `FAIL`.
- `git status --short --untracked-files=all` limpio salvo archivos deliberadamente no versionados antes de `npm run clean:generated`.
- Snapshot de continuidad generado con `bash scripts/project/create-continuity-snapshot.sh --with-qa`.

Ronda visual responsive posterior:

- Rediseño responsive por módulos: Auditoría, Inicio, Productos, Inventario, Ventas, Reportes, Usuarios, Actividad de vendedores, Control de efectivo retirado y Login.
- Fixes de sidebars estrechos en formularios/filtros.
- Selectores E2E integrados estabilizados con `data-testid` y locators scoped.
- Chunks de Vite estabilizados para remover el warning circular entre `vendor` y `vendor-mui-core`.
- Layout lateral y grids de métricas visuales consolidados con componentes compartidos.
- Cierre documentado en `docs/qa/visual-release-checklist.md`.

Criterio esperado al cerrar la ronda visual:

- `web:e2e` 18/18.
- `web:e2e:integration` 2/2.
- `docker:build` verde.
- Bundle audit sin `FAIL`; `WARN` de JS total aceptable temporalmente si queda debajo del umbral de fallo.
- Sin warning circular de chunks en `npm run web:build`.

## 4. Validación final recomendada antes de migrar

Desde la raíz:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run clean:generated
npm run ci:validate-lockfiles
npm run api:prisma:validate
npm run api:build
npm run api:test:critical
npm run web:build
node scripts/web/audit-bundle.js
npm run web:test
npm run web:e2e
npm run web:e2e:integration
npm run docker:config
npm run docker:build
```

Si Docker Desktop no está listo, al menos deja registrado el fallo de `docker ps` o valida Docker después.

## 5. Generar snapshot para el próximo chat

Usa el script agregado en Patch 70:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

bash scripts/project/create-continuity-snapshot.sh --with-qa
```

Si quieres un snapshot rápido sin correr QA completa:

```bash
bash scripts/project/create-continuity-snapshot.sh
```

El script genera, dentro de `.puntaventa_diagnostics/`, archivos con timestamp:

- `punta-venta-continuity-YYYYMMDD-HHMMSS.md`
- `punta-venta-current-diagnostics-YYYYMMDD-HHMMSS.txt`
- `Punta_Venta_current_YYYYMMDD-HHMMSS.tar.gz`

Adjunta esos archivos en el chat nuevo.

## 6. Mensaje inicial para pegar en el nuevo chat

Copia y pega este mensaje, reemplazando los datos de validación si aplica:

```text
Estoy continuando el proyecto Punta Venta desde un snapshot actual del repo.

Quiero que reconstruyas el estado real desde los archivos adjuntos, sin asumir código viejo ni generar cambios a ciegas.

Adjunto:
- Punta_Venta_current_YYYYMMDD-HHMMSS.tar.gz
- punta-venta-current-diagnostics-YYYYMMDD-HHMMSS.txt
- punta-venta-continuity-YYYYMMDD-HHMMSS.md

Ruta local:
C:\Users\drago\Proyectos\Punta_Venta

Stack:
- Monorepo apps/api + apps/web
- API: Node.js + Express + TypeScript + Prisma + PostgreSQL
- Web: React + Vite + TypeScript + Material UI
- Auth: JWT access/refresh, cookies httpOnly, CSRF
- Tests: Jest API, Vitest web, Playwright mockeado, Playwright integrado real con PostgreSQL
- Docker Compose para Postgres/API/Web

Modelo funcional obligatorio:
Punta Venta no es un POS clásico dependiente de control de efectivo retirado abierta. El flujo correcto es admin/dueño + vendedores. La venta en efectivo no debe depender de control de efectivo retirado abierta. CASHIER se conserva como enum técnico, pero en UI/documentación debe tratarse como Vendedor.

Estado esperado:
Ya quedaron aplicados los patches 50a–70 y la ronda 120–140. El proyecto incluye cobertura E2E/API, auditoría operativa con redacción de datos sensibles, actividad de vendedores con auto-refresh, eliminación física de productos con historial preservado, costos históricos y utilidad bruta en reportes, refactor frontend/backend modular, contratos HTTP frontend centralizados, factories E2E, documentación de arquitectura, guardrails de bundle y guardrails de calidad para patches.

Reglas obligatorias:
- Responde en español.
- Prioriza precisión sobre velocidad.
- Patches pequeños, numerados y con objetivo único.
- No mezcles refactor con features.
- No cambies contratos HTTP sin advertirlo.
- No generes patches contra código viejo.
- Antes de entregar patches valida con:
  git apply --check --whitespace=error
  git diff --check
  git diff --name-status
- Verifica explícitamente que archivos nuevos estén incluidos en el patch.
- Evita trailing whitespace.
- Mantén compatibilidad Windows/Git Bash.
- Para E2E usa data-testid en controles críticos, locators scoped por diálogo/sección/fila y evita force:true salvo justificación fuerte.

Comandos base:
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run ci:validate-lockfiles
npm run api:prisma:validate
npm run api:build
npm run api:test:critical
npm run web:build
node scripts/web/audit-bundle.js
npm run web:test
npm run web:e2e

Validación completa:
npm run web:e2e:integration
npm run docker:config
npm run docker:build

Siguiente etapa recomendada:
No continuar refactorizando por inercia. Primero analizar el snapshot actual y proponer el siguiente objetivo con bajo riesgo. Prioridades probables:
1. Release smoke manual y revisión visual responsive real.
2. Preparación de entorno producción/CI/CD.
3. Observabilidad y logs estructurados con destino externo.
4. Liquidaciones/entregas de efectivo si el negocio confirma ese flujo.
5. Roles/permisos persistidos si se requiere administración granular.
6. Mejoras funcionales nuevas solo si están bien delimitadas.
```

## 7. Reglas para el próximo asistente

El próximo chat debe empezar con auditoría, no con patch inmediato.

Orden correcto:

1. Leer snapshot y diagnóstico.
2. Confirmar estado Git y validaciones.
3. Identificar si hay cambios sin commit.
4. Proponer el siguiente patch pequeño.
5. Generar patch solo si el estado lo permite.
6. Validar el patch con whitespace estricto y lista de archivos.

## 8. Señales para detener patches y validar

Detén la generación de patches y valida si aparece cualquiera de estos casos:

- `api:build` falla.
- `api:test:critical` falla.
- `web:e2e` falla por selector ambiguo.
- `web:e2e:integration` falla por datos reales.
- `git diff --check` muestra whitespace.
- `git apply --check --whitespace=error` falla.
- Un import apunta a un archivo nuevo no incluido.
- El patch modifica varias capas sin justificación.

## 9. Commits recomendados al cerrar

Antes de cambiar de chat, deja un commit por patch o por grupo coherente. No mezcles validaciones locales ni snapshots con código fuente.

Verifica:

```bash
git status --short
git log --oneline -20
git diff --check
```

Si todo está commiteado, el snapshot nuevo será mucho más confiable para el siguiente chat.
