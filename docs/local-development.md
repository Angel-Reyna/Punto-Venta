# Operación local de Punta Venta

Esta guía describe el flujo recomendado para trabajar en local con API y Web ejecutándose con `npm`, y PostgreSQL levantado con Docker Compose. No aplica al modo Docker completo; ese flujo queda separado porque dentro de contenedores la API usa el host `postgres`, mientras que en local usa `localhost`.

## Requisitos

- Node.js 22 LTS. El `package.json` raíz declara `node >=22`; usa la misma versión que CI y Docker para evitar diferencias de TypeScript, Vite, Prisma o Playwright.
- npm 10 o superior.
- Docker Desktop activo, usado en local solo para PostgreSQL.
- Git Bash, PowerShell o una terminal equivalente.
- Puertos libres: `4000` para API, `5173` para Web, `5432` para PostgreSQL local, `4010` y `5175` para E2E integrado.

Verificación rápida:

```bash
node -v
npm -v
docker --version
docker compose version
```

## Instalación inicial

Desde la raíz del repositorio:

```bash
npm --prefix apps/api ci
npm --prefix apps/web ci
npm run ci:validate-lockfiles
```

Si cambias dependencias, actualiza solo el paquete afectado y commitea su lockfile:

```bash
npm --prefix apps/api install <paquete>
npm --prefix apps/web install <paquete>
```

## Variables de entorno locales

Copia los ejemplos una sola vez:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Valores esperados para desarrollo local fuera de Docker:

```env
# apps/api/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_senior_db?schema=public"
CORS_ORIGIN="http://localhost:5173"
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
SEED_ADMIN_EMAIL="admin@pos.local"
SEED_ADMIN_PASSWORD="Admin12345DevOnly"
SEED_DEMO_DATA=true
```

```env
# apps/web/.env
VITE_API_URL="http://localhost:4000/api"
```

No uses `postgres` como host en `apps/api/.env` cuando la API corre con `npm run api:dev`. Ese host solo existe dentro de Docker Compose.

## Bootstrap recomendado

El flujo más seguro para desarrollo local es:

```bash
npm run dev:bootstrap
```

Ese comando:

1. detiene contenedores `api` y `web` si estaban usando puertos locales;
2. levanta solo PostgreSQL con Docker Compose;
3. genera Prisma Client;
4. aplica migraciones con `prisma migrate deploy`;
5. ejecuta el seed local;
6. corre `dev:doctor` para validar configuración, CORS, cookies, Prisma y usuario admin.

Puedes ejecutar el doctor por separado cuando algo no cuadre:

```bash
npm run dev:doctor
```

## Arranque diario

Terminal 1:

```bash
npm run dev:db
```

Terminal 2:

```bash
npm run api:dev
```

Terminal 3:

```bash
npm run web:dev
```

URLs locales:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:4000
Health:   http://localhost:4000/health
```

Credencial seed de desarrollo:

```txt
Correo:      admin@pos.local
Contraseña:  Admin12345DevOnly
```

## Validación antes de cerrar un cambio

Validación rápida para cambios críticos acotados:

```bash
npm run qa:critical
```

Validación local recomendada antes de cerrar un patch común:

```bash
npm run qa:local
```

`qa:local` ejecuta lockfiles, Prisma generate/validate, build API, tests críticos API, Vitest, tests críticos web, build web, listado E2E mockeado y E2E mockeado.

Validación completa cuando tocaste autenticación, ventas, inventario, reportes, Prisma, Docker o E2E:

```bash
npm run qa:full
```

`qa:full` agrega listado E2E integrado, E2E integrado real, `docker compose config` y build Docker API/Web.

Si un paso falla, ejecuta el comando individual equivalente para aislar la causa:

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

La separación de pruebas es intencional:

- `npm run web:test`: Vitest; no ejecuta specs Playwright.
- `npm run web:e2e`: Playwright con API mockeada; rápido y enfocado en navegación/UX.
- `npm run web:e2e:integration`: Playwright con API real y PostgreSQL real en schema `e2e`.

## E2E integrado local

Ejecuta:

```bash
npm run web:e2e:integration
```

Este flujo usa por defecto:

```txt
PostgreSQL: 127.0.0.1:5432
Schema:     e2e
API:        http://127.0.0.1:4010
Web:        http://127.0.0.1:5175
```

El runner resetea únicamente el schema `e2e`. Si cambias `E2E_DATABASE_URL`, debe seguir apuntando a una base descartable. El runner rechaza por defecto schemas distintos a `e2e` para evitar borrar datos locales útiles.

Credenciales E2E:

```txt
Admin:    admin.e2e@puntaventa.test / Admin12345DevOnly
Vendedor: vendedor.e2e@puntaventa.test / Vendedor12345DevOnly
Producto: E2E-COCA-600
```


## Limpieza local segura

Después de builds o E2E puedes borrar artefactos generados con:

```bash
npm run clean:generated
```

El script elimina `dist`, `test-results`, `playwright-report`, `*.tsbuildinfo`, diagnósticos locales y archivos accidentales conocidos. No elimina `.env` ni `node_modules`.

## Recuperación de errores comunes

### `EADDRINUSE` en API o Web

Hay un proceso usando el puerto.

```bash
docker compose stop api web
npm run dev:db
```

Si persiste en Windows/Git Bash:

```bash
netstat -ano | findstr :4000
netstat -ano | findstr :5173
```

Finaliza solo el proceso que reconoces como seguro cerrar.

### Prisma Client desactualizado

```bash
npm run api:prisma:generate
```

Después repite build/test API.

### Base local inconsistente

Si aún estás en fase de concepto y no necesitas conservar datos:

```bash
docker compose down -v
npm run dev:bootstrap
```

Esto borra el volumen local de PostgreSQL.

### `dev:doctor` falla por `DATABASE_URL`

Para API local debe ser `localhost`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_senior_db?schema=public"
```

Para Docker Compose completo debe ser `postgres`, pero mediante `DOCKER_DATABASE_URL` en el `.env` usado por Docker:

```env
DOCKER_DATABASE_URL="postgresql://postgres:postgres@postgres:5432/pos_senior_db?schema=public"
```

### Playwright no encuentra Chromium

```bash
npm --prefix apps/web run playwright:install
```

### Vitest intenta ejecutar Playwright

Eso no debería ocurrir. Revisa que exista `apps/web/vitest.config.ts` y que excluya `e2e/**`.

### El E2E integrado falla en Reportes con texto oculto

Primero abre el trace:

```bash
npm --prefix apps/web exec playwright show-trace test-results/<carpeta>/trace.zip
```

Si el dato existe en DOM pero Playwright lo ve como `hidden`, revisa layout responsive, overflow, duplicados móvil/desktop o elementos virtualizados antes de cambiar el selector.
