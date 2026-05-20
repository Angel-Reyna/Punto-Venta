# Punta Venta

Aplicación web para punto de venta, inventario, productos, reportes, auditoría, corte de caja y administración de vendedores.

## Stack

- Frontend: React + Vite + TypeScript + Material UI
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL
- ORM: Prisma
- Auth: JWT access token + refresh token en cookie httpOnly
- Roles: `ADMIN` y `CASHIER`
- Excel: importación y plantilla descargable
- PDF: reportes descargables
- Docker: PostgreSQL, API y frontend con Nginx
- CI: GitHub Actions

## Desarrollo local sin Docker para la app

Levanta primero PostgreSQL:

```bash
docker compose up -d postgres
```

Backend:

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Frontend, en otra terminal:

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

URLs locales:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:4000
Health:   http://localhost:4000/health
```

## Ejecutar todo con Docker Compose

Para levantar PostgreSQL, API y frontend servido por Nginx:

```bash
cp docker.env.example .env
docker compose up --build
```

URLs Docker:

```txt
Frontend/Nginx: http://localhost:8080
API directa:    http://localhost:4000
Health:         http://localhost:8080/health
```

Para crear o actualizar el usuario administrador inicial dentro del contenedor, después de que la API esté levantada:

```bash
docker compose exec api npm run seed:prod
```

Para incluir PgAdmin:

```bash
docker compose --profile tools up --build
```

PgAdmin queda disponible en:

```txt
http://localhost:5050
```

## Usuario inicial de desarrollo

Después de ejecutar el seed con `docker.env.example` o `apps/api/.env.example`:

```txt
Correo:      admin@pos.local
Contraseña:  Admin12345DevOnly
```

Cambia esta contraseña antes de usar datos reales.

## Comandos útiles

Backend:

```bash
cd apps/api
npm run build
npm test
npx prisma studio
```

Frontend:

```bash
cd apps/web
npx tsc -b
npm run build
npm run preview
```

Docker:

```bash
docker compose build api web
docker compose up -d postgres api web
docker compose logs -f api
docker compose down
```

Para borrar datos locales de PostgreSQL en Docker:

```bash
docker compose down -v
```

## Backups y restauración

Crear backup:

```bash
./scripts/db/backup-postgres.sh
```

Restaurar backup:

```bash
./scripts/db/restore-postgres.sh backups/<archivo>.dump
```

Más detalle en:

```txt
docs/production/backup-restore.md
```

## Producción

Usa `docker.env.production.example` como plantilla, no como archivo final de secretos:

```bash
cp docker.env.production.example .env
```

Antes de arrancar, cambia todos los valores `CHANGE_ME`.

En producción real configura:

```txt
API_NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
VITE_API_URL=/api
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
SEED_DEMO_DATA=false
```

Luego:

```bash
docker compose up -d --build
docker compose exec api npm run seed:prod
```

Checklist recomendado:

```txt
docs/production/checklist.md
```

## Notas de seguridad

No uses secretos de desarrollo en producción. Define valores largos y únicos para:

```txt
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
TOKEN_HASH_PEPPER
POSTGRES_PASSWORD
SEED_ADMIN_PASSWORD
```

En producción, la app debe servirse por HTTPS para que las cookies seguras funcionen correctamente. Si web y API quedan bajo el mismo dominio mediante reverse proxy (`VITE_API_URL=/api`), usa `COOKIE_SAME_SITE=lax`. Si quedan en subdominios distintos, usa `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true` y configura `COOKIE_DOMAIN` al dominio padre controlado para que el frontend pueda leer la cookie CSRF no sensible. PgAdmin debe quedar deshabilitado o protegido detrás de una red privada/VPN.
