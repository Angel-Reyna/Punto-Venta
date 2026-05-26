# CI quality gates

El repositorio valida tres niveles: guardrails del monorepo, calidad de API/Web y build Docker.

## Jobs actuales

### Repository guardrails

- Usa Node.js 22.
- Valida lockfiles y límites de dependencias.
- Falla si hay artefactos generados versionados por accidente.
- Falla si hay archivos locales sensibles versionados por accidente.
- Falla si hay tests enfocados/omitidos, `debugger` o `force: true` en E2E.
- Valida sintaxis de scripts de automatización JavaScript y shell.
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
- Ejecuta la suite completa de Vitest frontend.
- Compila TypeScript y Vite.
- Ejecuta auditoría estricta del bundle web después del build.

### Web E2E smoke gate

- Instala Chromium.
- Ejecuta Playwright mockeado.
- Sube reporte Playwright como artefacto si existe.

### Docker build gate

- Valida Compose.
- Construye imágenes `api` y `web`.

## Scripts de tests críticos

Las listas de tests críticos viven en los `package.json` de cada app. El root y CI deben delegar en esos scripts para evitar divergencias entre `qa:local`, ejecución manual y GitHub Actions.

- API: `apps/api/package.json` -> `npm run test:critical`.
- Web: `apps/web/package.json` -> `npm run test:critical`.

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

## Guardrail de archivos sensibles locales

`npm run ci:check-sensitive-files` revisa únicamente archivos ya versionados con `git ls-files`. Su objetivo es bloquear commits que hayan incluido por accidente archivos privados o locales, por ejemplo:

- `.env`, `.env.local`, `.env.production` y variantes no sanitizadas.
- Llaves privadas o bundles de certificados: `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `*.keystore`.
- Llaves SSH como `id_rsa` o `id_ed25519`.
- Credenciales cloud comunes como `service-account*.json`, `credentials*.json` o `firebase-adminsdk*.json`.
- Bases de datos locales y backups: `*.sqlite`, `*.db`, `*.dump`, `*.backup`, `*.bak` y contenido real dentro de `backups/`.

Se permiten ejemplos sanitizados como `.env.example`, `.env.test.example`, `docker.env.example` y `docker.env.production.example`. Si falla, desversiona el archivo sensible y conserva solo una plantilla sin secretos reales.

## Guardrail de scripts de automatización

`npm run ci:check-scripts` valida los scripts versionados antes de que CI dependa de ellos:

- `scripts/**/*.js` con `node --check`.
- `scripts/**/*.sh` con `bash -n` cuando Bash está disponible, o `sh -n` como fallback.

El objetivo es fallar rápido si un patch deja una automatización con sintaxis inválida, especialmente en scripts de CI, limpieza, snapshots, E2E integrado o auditoría de bundle.

## Guardrail de tests y E2E

`npm run ci:check-test-guardrails` escanea `apps/api/tests`, `apps/web/src` y `apps/web/e2e` para bloquear atajos que suelen ocultar regresiones:

- `describe.only`, `it.only` y `test.only`.
- `describe.skip`, `it.skip` y `test.skip`.
- `debugger`.
- `force: true` dentro de Playwright E2E.

Si un test necesita desactivarse temporalmente, no uses `.skip` silencioso. Elige una de estas opciones:

1. Corrige el test o el bug antes de integrar.
2. Extrae el caso a un issue/tarea explícita y retira el archivo del gate solo si hay justificación técnica.
3. Documenta la excepción en el patch correspondiente.

## Reglas de dependencias

- Cada app conserva su propio `package-lock.json`.
- Los Dockerfiles usan `npm ci`, no `npm install`.
- Si cambias dependencias, actualiza solo el lockfile de la app afectada.
- Evita dependencias locales tipo `file:../..`, porque rompen los build contexts de Docker.

## Criterios de fallo que sí deben bloquear

- Prisma no valida o no genera client.
- Tests críticos API fallan.
- Vitest ejecuta specs Playwright.
- Hay archivos sensibles o locales versionados por accidente.
- Hay tests enfocados/omitidos, `debugger` o `force: true` en E2E.
- Un script de automatización JavaScript o shell tiene sintaxis inválida.
- `web:e2e` lista specs de `e2e/integration`.
- Docker Compose resuelve `DATABASE_URL` de API con `localhost` dentro del contenedor.
- Docker build falla.
- Bundle web excede umbrales `FAIL` en modo estricto de CI.
