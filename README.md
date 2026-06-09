# Punta Venta

Punta Venta es una aplicación web para administrar ventas físicas reportadas por vendedores, inventario, productos, usuarios, reportes operativos y auditoría. No está modelada como un POS clásico con apertura/cierre operativo obligatorio para vender: el flujo principal es que el vendedor registra la venta de productos físicos y el administrador consulta operación, existencias y desempeño.

## Funciones principales

### Para administradores

- Panel de inicio con métricas operativas.
- Gestión de productos: crear, editar, activar/desactivar, importar desde Excel y descargar plantilla.
- Inventario: existencias, movimientos y ajustes autorizados.
- Ventas: consultar historial, crear ventas, cancelar ventas y registrar devoluciones.
- Reportes: ventas netas, métodos de pago, productos vendidos, ventas por vendedor y PDF operativo.
- Usuarios: alta de vendedores, cambio de rol, reset de contraseña y activación/desactivación.
- Auditoría y actividad de vendedores para revisar operaciones sensibles e intentos no autorizados.

### Para vendedores

- Inicio operativo con accesos permitidos.
- Consulta de productos activos e inventario visible.
- Registro de ventas sin apertura operativa previa.
- Historial de sus ventas.
- Bloqueo de rutas y acciones administrativas.

## Pantallas/módulos

| Módulo | Propósito | Acceso principal |
| --- | --- | --- |
| Inicio | Resumen operativo y métricas iniciales. | Admin y vendedor, con datos según permisos. |
| Productos | Catálogo, altas, edición, importación Excel y estado activo/inactivo. | Admin; vendedor solo lectura cuando aplica. |
| Inventario | Existencias, movimientos y ajustes. | Admin gestiona; vendedor consulta. |
| Ventas | Punto de registro de ventas e historial. | Admin y vendedor; acciones según permisos. |
| Reportes | Reporte operativo por periodo, productos, métodos y vendedor. | Admin. |
| Usuarios | Administración de cuentas y roles. | Admin. |
| Auditoría | Revisión de acciones críticas. | Admin. |
| Actividad de vendedores | Seguimiento operativo e intentos bloqueados. | Admin. |

## Stack técnico

- Monorepo con `apps/api` y `apps/web`.
- API: Node.js, Express, TypeScript, Prisma y PostgreSQL.
- Web: React, Vite, TypeScript y Material UI.
- Autenticación: access token JWT en memoria y refresh token en cookie `httpOnly`.
- Seguridad: validación Zod, rate limiting, Helmet, CORS, CSRF para cookies, sesiones refresh persistidas y revocables.
- Pruebas: Jest para API, Vitest para frontend, Playwright mockeado y Playwright integrado con PostgreSQL real.
- Infraestructura local: Docker Compose para PostgreSQL, API, Web/Nginx y PgAdmin opcional.

## Estructura del proyecto

```txt
apps/
  api/                  Backend Express + Prisma
  web/                  Frontend React/Vite
scripts/
  ci/                   Guardrails de CI/lockfiles
  db/                   Backup y restore PostgreSQL
  e2e/                  Runner E2E integrado real
docs/
  checklists/           Auditoría y cierre de cambios
  production/           Producción, backup y restore
  qa/                   Matriz funcional crítica
```

## Requisitos locales

- Node.js 22 LTS recomendado. El proyecto declara `engines.node >=22` y CI/Docker usan Node 22.
- npm 10 o superior.
- Docker Desktop para PostgreSQL local, Docker Compose y E2E integrado.
- Puertos habituales libres: `4000` y `5173` para desarrollo local; `4001` y `8080` para Docker completo; `5432` para PostgreSQL Docker local; `4010` y `5175` para E2E integrado.

Verificación rápida:

```bash
node -v
npm -v
docker --version
docker compose version
```


> Versión de Node recomendada: Node 22. El repositorio incluye `.nvmrc` y `.node-version`; `package.json` acepta `>=22 <25`, pero CI y Docker usan Node 22.

## Inicio rápido local

El modo local recomendado ejecuta API y Web con `npm`, y PostgreSQL con Docker Compose.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm --prefix apps/api ci
npm --prefix apps/web ci
npm run dev:bootstrap
```

Después abre dos terminales:

```bash
npm run api:dev
```

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

Guía detallada: `docs/local-development.md`.

## Inicio rápido con Docker Compose

El modo Docker ejecuta PostgreSQL, API y frontend servido por Nginx. En este modo la API debe conectarse a PostgreSQL con el host interno `postgres`, no `localhost`.

```bash
cp docker.env.example .env
npm run docker:config
npm run docker:build
docker compose up -d postgres api web
docker compose exec api npm run seed:prod
```

URLs Docker por defecto:

```txt
Frontend/Nginx: http://localhost:8080
API directa:    http://localhost:4001
Health Web:     http://localhost:8080/health
Health API:     http://localhost:4001/health
```

Docker mantiene la API dentro del contenedor en el puerto `4000`; `4001` es solo el puerto publicado en tu máquina para evitar choque con `npm run api:dev`.

Guía detallada: `docs/docker-operations.md`.

## Validación

Validación crítica rápida:

```bash
npm run qa:critical
```

Validación local recomendada antes de cerrar un cambio común:

```bash
npm run qa:local
```

Validación completa de cierre:

```bash
npm run qa:full
```

`qa:full` valida lockfiles, Prisma, build API, tests críticos API, Vitest, build Web, E2E mockeado, E2E integrado real, Docker Compose config y build Docker.

Comandos individuales útiles:

```bash
npm run web:e2e:list
npm run web:e2e
npm run web:e2e:integration:list
npm run web:e2e:integration
npm run docker:config
npm run docker:build
```

## Limpieza de artefactos generados

Para borrar salidas locales que no deben commitearse:

```bash
npm run clean:generated
```

Esto elimina `dist`, `test-results`, `playwright-report`, `*.tsbuildinfo`, diagnósticos locales y archivos accidentales conocidos, sin tocar `.env` ni `node_modules`.

## Snapshot de continuidad

Antes de generar un nuevo snapshot, limpia diagnósticos anteriores. El comando recomendado ya hace esa limpieza y genera un paquete sanitizado sin `.env`, secretos, dependencias ni builds:

```bash
npm run project:snapshot
```

Para incluir QA en el diagnóstico:

```bash
npm run project:snapshot:qa
```

Los archivos quedan en `.puntaventa_diagnostics/`. El snapshot se genera desde `git archive` cuando el árbol está limpio, por lo que solo incluye archivos versionados y evita adjuntar secretos locales por accidente.

## Documentación

| Documento | Uso |
| --- | --- |
| `ARCHITECTURE.md` | Decisiones técnicas, estado arquitectónico y siguientes mejoras. |
| `docs/local-development.md` | Operación local con API/Web por npm y PostgreSQL en Docker. |
| `docs/docker-operations.md` | Operación completa con Docker Compose. |
| `docs/e2e-playwright.md` | E2E mockeado de frontend. |
| `docs/e2e-integration.md` | E2E real con backend y PostgreSQL. |
| `docs/qa/critical-flows.md` | Matriz funcional crítica por rol. |
| `docs/qa/final-project-audit.md` | Auditoría final contra el plan de mejoras y criterios de cierre. |
| `docs/checklists/final-audit.md` | Checklist de cierre de patches. |
| `docs/production/checklist.md` | Checklist antes de usar datos reales. |
| `docs/production/backup-restore.md` | Backup y restore PostgreSQL. |

## Seguridad operativa

No uses secretos de desarrollo en producción. Define valores largos y únicos para:

```txt
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
TOKEN_HASH_PEPPER
POSTGRES_PASSWORD
SEED_ADMIN_PASSWORD
```

En producción sirve la aplicación por HTTPS. Si Web y API comparten dominio mediante reverse proxy (`VITE_API_URL=/api`), usa `COOKIE_SAME_SITE=lax`. Si quedan en dominios distintos, usa `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true` y configura `COOKIE_DOMAIN` solo para un dominio padre controlado. PgAdmin debe estar apagado o protegido por red privada/VPN.

## Producción

Usa `docker.env.production.example` como plantilla, no como archivo final de secretos:

```bash
cp docker.env.production.example .env
```

Antes de arrancar, cambia todos los valores `CHANGE_ME` y revisa:

```txt
docs/production/checklist.md
```
