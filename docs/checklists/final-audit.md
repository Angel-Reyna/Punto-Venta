# Checklist final de auditoría

Este checklist cierra la etapa actual de Punta Venta. Úsalo antes de considerar estable un patch que toque backend, frontend, Prisma, Docker, autenticación, ventas, inventario, reportes o pruebas E2E.

## Principios de cierre

- Trabaja con `git status --short` limpio antes de aplicar un patch nuevo.
- Aplica un patch por vez y valida antes de continuar.
- No mezcles código, Docker, E2E y documentación en el mismo commit salvo que el cambio sea inseparable.
- No cierres un patch con artefactos generados en Git: `dist`, `test-results`, `playwright-report`, diagnósticos locales o traces.
- Si una prueba E2E falla porque un dato existe en DOM pero Playwright lo ve como `hidden`, revisa layout, responsive, overflow, duplicados móvil/desktop o virtualización antes de cambiar el selector.

## Preflight antes de aplicar un patch

```bash
git status --short
node -v
npm -v
docker --version
docker compose version
npm run ci:validate-lockfiles
```

Criterios:

- Node debe ser compatible con `engines.node`; para reproducibilidad usa Node 22, que es la versión usada por CI y Docker.
- No debe haber cambios locales no relacionados con el patch.
- Docker Desktop debe estar activo si el patch toca PostgreSQL, Docker o E2E integrado.
- Los lockfiles deben coincidir con sus `package.json`.

## Preflight obligatorio al generar patches

Antes de entregar o aplicar un patch generado fuera del repositorio local, verifica el paquete completo del cambio:

```bash
git diff --name-status
git diff --check
git apply --check --whitespace=error RUTA/AL/PATCH.patch
node scripts/patch/validate-patch.js RUTA/AL/PATCH.patch
```

Criterios:

- `git diff --name-status` debe incluir todos los archivos nuevos (`A`) y modificados (`M`).
- Los archivos nuevos deben aparecer físicamente en el patch; no basta con cambiar imports.
- `git diff --check`, `git apply --check --whitespace=error` y `node scripts/patch/validate-patch.js RUTA/AL/PATCH.patch` no deben reportar trailing whitespace ni errores de formato.
- `node scripts/patch/validate-patch.js` imprime los archivos detectados dentro del patch; revisa esa lista antes de aplicarlo.
- Si el patch agrega imports relativos, valida que cada archivo importado exista y esté incluido.
- Si el patch mueve schemas, mappers o helpers, valida que las rutas sigan importando desde el nuevo origen.
- No uses `--ignore-whitespace` para aprobar la calidad del patch; úsalo solo como compatibilidad de aplicación cuando el archivo ya fue validado con `--whitespace=error`.

## Validación rápida por tipo de cambio

### Solo documentación

```bash
git diff --check
```

Si la documentación cambia comandos, variables o rutas críticas, ejecuta también el comando documentado principal. Por ejemplo, si modificas Docker, ejecuta `docker compose config`.

### Frontend sin flujo E2E real

```bash
npm run web:test
npm run web:test:critical
npm run web:build
node scripts/web/audit-bundle.js
npm run web:e2e
```

Criterios:

- `web:test` ejecuta Vitest y no debe recoger archivos `apps/web/e2e/**`.
- `web:e2e` ejecuta solo la suite mockeada.
- `node scripts/web/audit-bundle.js` es informativo por defecto; úsalo para detectar crecimiento de chunks antes de optimizar.
- El listado esperado de la suite mockeada debe excluir `e2e/integration/**`.

Validación explícita del listado:

```bash
npm --prefix apps/web run e2e -- --list
```

### Backend/API

```bash
npm run api:prisma:generate
npm run api:prisma:validate
npm run api:build
npm run api:test:critical
```

Si cambias servicios críticos, permisos, auth, ventas, inventario, importación o reportes, ejecuta también:

```bash
npm run api:test
```

Si el cambio es un refactor backend por dominio, revisa además `docs/architecture/backend-modules.md` y valida que la documentación siga describiendo la estructura real del módulo.

### Prisma o migraciones

```bash
npm run dev:db
npm run api:prisma:generate
npm run api:prisma:validate
npm --prefix apps/api run prisma:migrate:deploy
npm run api:test:critical
npm run web:e2e:integration
```

Criterios:

- Las migraciones aplican contra una base local descartable.
- El E2E integrado usa schema `e2e`, no `public`.
- No ejecutes resets destructivos contra bases con datos útiles.

### Ventas, inventario o reportes

```bash
npm run api:test:critical
npm run web:test
npm run web:e2e
npm run web:e2e:integration
```

Criterios funcionales mínimos:

- El vendedor puede registrar venta sin caja obligatoria.
- La venta descuenta inventario real.
- La venta aparece en historial.
- El admin puede verla reflejada en reportes.
- No se introducen selectores E2E dependientes de contenido oculto o layout frágil.

### Autenticación, autorización o navegación

```bash
npm run api:test:critical
npm run web:test:critical
npm run web:e2e
npm run web:e2e:integration
```

Criterios:

- Vendedor no ve módulos administrativos.
- Rutas directas administrativas quedan bloqueadas.
- Admin conserva acceso a productos, usuarios, reportes y auditoría.
- Refresh/logout siguen funcionando con cookies y CSRF.

### Docker o variables de entorno

```bash
docker compose config
docker compose build api web
```

Criterios:

- En `docker compose config`, el servicio `api` debe mostrar `DATABASE_URL` con host `postgres`, no `localhost`.
- `DOCKER_DATABASE_URL` se usa para Compose.
- `DATABASE_URL` queda reservado para `apps/api/.env` cuando API corre fuera de Docker.

Validación operativa opcional:

```bash
docker compose up -d postgres api web
docker compose ps
docker compose logs api
docker compose down
```

## Validación completa de cierre

Para un patch común, ejecuta:

```bash
npm run qa:local
```

Antes de cerrar una ronda grande o crear un tag interno de estabilidad, ejecuta:

```bash
npm run qa:full
```

`qa:full` equivale a este bloque explícito:

```bash
npm run ci:validate-lockfiles
npm run api:prisma:generate
npm run api:prisma:validate
npm run api:build
npm run api:test:critical
npm run web:test
npm run web:test:critical
npm run web:build
npm run web:e2e:list
npm run web:e2e
npm run web:e2e:integration:list
npm run web:e2e:integration
npm run docker:config
npm run docker:build
```

Resultado esperado:

```txt
Lockfiles válidos.
Prisma schema válido.
API build OK.
Tests críticos API OK.
Vitest OK.
Build Web OK.
E2E mockeado OK.
E2E integrado real OK.
Docker Compose config usa postgres:5432.
Docker build API/Web OK.
```

## Checklist antes de commit

```bash
npm run clean:generated
git status --short
git diff --name-status
git diff --check
git diff --stat
```

Verifica:

- El commit incluye solo archivos relacionados con el patch.
- Los archivos nuevos aparecen como `A` en `git diff --name-status` o en `git status --short`.
- No hay `.env`, logs, screenshots, videos, traces, `dist`, `*.tsbuildinfo`, carpetas de resultados ni notas personales versionadas.
- Si eliminaste archivos generados ya trackeados, usa `git add -A`.
- El mensaje de commit usa un scope claro: `fix`, `test`, `docs`, `chore`, `refactor`.

Ejemplos:

```bash
git commit -m "test(e2e): validate integrated sale in reports"
git commit -m "fix(docker): isolate compose database url"
git commit -m "docs: add docker operations runbook"
```

## Diagnóstico por fallo común

### Vitest ejecuta specs Playwright

Síntoma:

```txt
Playwright Test did not expect test.describe() to be called here.
```

Revisar:

- `apps/web/vitest.config.ts` existe.
- `test.exclude` contiene `**/e2e/**`.
- El script `npm run web:test` no invoca Playwright.

### `web:e2e` ejecuta el test integrado real

Síntoma:

```txt
e2e/integration/real-sales-flow.spec.ts aparece en npm run web:e2e -- --list
```

Revisar:

- `apps/web/playwright.config.ts` contiene `testIgnore: ["**/integration/**"]`.
- `apps/web/playwright.integration.config.ts` es la única entrada para `e2e/integration/**`.

### E2E integrado intenta resetear schema incorrecto

Síntoma:

```txt
Refusing to reset schema "public". Integrated E2E requires schema=e2e.
```

Acción:

- Corrige `E2E_DATABASE_URL` para usar `?schema=e2e`.
- No uses overrides destructivos salvo que sepas exactamente qué base vas a borrar.

### Texto existe pero Playwright lo marca hidden

Síntoma:

```txt
locator resolved to <...> - unexpected value "hidden"
```

Acción:

- Abre el trace.
- Revisa si el texto está en un panel colapsado, duplicado móvil/desktop, tabla virtualizada, contenedor con overflow o grid con ancho insuficiente.
- Corrige el layout o agrega semántica accesible antes de endurecer el selector.

### Docker API no conecta a PostgreSQL

Síntomas:

```txt
ECONNREFUSED
P1001
healthcheck failing
```

Acción:

```bash
docker compose config
docker compose logs postgres
docker compose logs api
```

El servicio `api` debe usar `@postgres:5432`, no `@localhost:5432`.


### Patch falla por archivo nuevo faltante

Síntoma:

```txt
Cannot find module './modulo.shared' or its corresponding type declarations.
```

Acción:

```bash
git diff --name-status
node scripts/patch/validate-patch.js RUTA/AL/PATCH.patch
find apps/api/src apps/web/src -path '*modulo.shared.ts' -o -path '*modulo.shared.tsx'
```

Criterio:

- Si un import nuevo apunta a un archivo nuevo, el patch debe mostrar ese archivo como `A`.
- No aceptes un patch que solo modifica imports sin incluir el archivo destino.
- Después del fix, ejecuta `npm run api:build` o `npm run web:build`, según aplique.

### Prisma Client desactualizado

Acción:

```bash
npm run api:prisma:generate
npm run api:build
```

### Puertos ocupados

Acción:

```bash
docker compose stop api web
npm run dev:db
```

En Windows/Git Bash:

```bash
netstat -ano | findstr :4000
netstat -ano | findstr :5173
netstat -ano | findstr :4010
netstat -ano | findstr :5175
```

## Credenciales seed documentadas

Desarrollo local y Docker dev:

```txt
Admin: admin@pos.local / Admin12345DevOnly
```

E2E integrado:

```txt
Admin:    admin.e2e@puntaventa.test / Admin12345DevOnly
Vendedor: vendedor.e2e@puntaventa.test / Vendedor12345DevOnly
Producto: E2E-COCA-600
```

Estas credenciales son solo para desarrollo y pruebas. No deben usarse con datos reales.

## Criterio de cierre de esta etapa

La etapa queda cerrada cuando:

- Patch 28 tiene suites aisladas, runner E2E protegido, E2E real vendedor→venta→inventario→reportes y Docker Compose sin `localhost` interno.
- Patch 29 tiene guías local/Docker, checklist final y comandos de recuperación.
- La validación completa de cierre pasa en la máquina local.
- `git status --short` queda limpio después de correr tests y E2E.
