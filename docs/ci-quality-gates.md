# CI quality gates

El repositorio valida tres niveles: guardrails del monorepo, calidad de API/Web y build Docker.

## Jobs actuales

### Repository guardrails

- Usa Node.js 22.
- Valida lockfiles y límites de dependencias.
- Falla si hay artefactos generados versionados por accidente.
- Valida que `docker compose config` sea resoluble.

### API quality gate

- Instala con `npm ci`.
- Valida Prisma.
- Genera Prisma Client.
- Aplica migraciones contra PostgreSQL real de CI.
- Ejecuta pruebas críticas.
- Ejecuta suite completa API.
- Compila TypeScript.

### Web quality gate

- Instala con `npm ci`.
- Ejecuta pruebas críticas de permisos y navegación.
- Compila TypeScript y Vite.

### Web E2E smoke gate

- Instala Chromium.
- Ejecuta Playwright mockeado.
- Sube reporte Playwright como artefacto si existe.

### Docker build gate

- Valida Compose.
- Construye imágenes `api` y `web`.

## Validación local equivalente

Para cambios comunes:

```bash
npm run qa:local
```

Para cierre de ronda o cambios en ventas, inventario, reportes, Prisma, Docker, auth o E2E:

```bash
npm run qa:full
```

`qa:full` agrega E2E integrado real y Docker build. Es el equivalente operativo más cercano a una validación completa local.


## Guardrail de artefactos generados

`npm run ci:check-generated-artifacts` revisa únicamente archivos ya versionados con `git ls-files`. Su objetivo es bloquear commits que hayan incluido por accidente outputs locales como `dist`, `build`, `.vite`, `.cache`, `coverage`, `test-results`, `playwright-report`, `.puntaventa_diagnostics`, `*.tsbuildinfo`, snapshots `Punta_Venta_current_*.tar.gz` y diagnósticos `punta-venta-current-diagnostics-*.txt`.

Si falla, limpia el árbol y desversiona el archivo afectado:

```bash
npm run clean:generated
git rm --cached <ruta-del-artefacto>
```

## Reglas de dependencias

- Cada app conserva su propio `package-lock.json`.
- Los Dockerfiles usan `npm ci`, no `npm install`.
- Si cambias dependencias, actualiza solo el lockfile de la app afectada.
- Evita dependencias locales tipo `file:../..`, porque rompen los build contexts de Docker.

## Criterios de fallo que sí deben bloquear

- Prisma no valida o no genera client.
- Tests críticos API fallan.
- Vitest ejecuta specs Playwright.
- `web:e2e` lista specs de `e2e/integration`.
- Docker Compose resuelve `DATABASE_URL` de API con `localhost` dentro del contenedor.
- Docker build falla.
