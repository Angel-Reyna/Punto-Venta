# Punta Venta

Aplicación web para punto de venta, inventario, productos, reportes, auditoría y administración de vendedores.

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

Después de ejecutar el seed:

```txt
Correo:      admin@pos.local
Contraseña:  Admin12345
```

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

## Notas de seguridad

No uses los secretos de `docker.env.example` en producción. Define secretos largos y únicos para:

```txt
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
TOKEN_HASH_PEPPER
POSTGRES_PASSWORD
```

En producción real, sirve la app por HTTPS y configura:

```txt
API_NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
VITE_API_URL=/api
```

El modo Docker local usa `API_NODE_ENV=development` para permitir cookies sobre HTTP local. En producción, `NODE_ENV=production` activa cookies seguras.
