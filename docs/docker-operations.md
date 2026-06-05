# Operación Docker de Punta Venta

Esta guía describe el flujo para ejecutar Punta Venta completamente con Docker Compose: PostgreSQL, API y Web/Nginx. No sustituye la guía local de `docs/local-development.md`; son modos distintos y no deben mezclarse en la misma sesión salvo que detengas los procesos que comparten puertos.

## Principio clave: `localhost` no es `postgres`

Cuando la API corre fuera de Docker con `npm run api:dev`, la base se alcanza en `localhost:5432`.

Cuando la API corre dentro de Docker Compose, `localhost` apunta al propio contenedor `api`. Por eso la API debe usar el host interno del servicio PostgreSQL:

```env
DOCKER_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pos_senior_db?schema=public
```

`docker-compose.yml` transforma `DOCKER_DATABASE_URL` en `DATABASE_URL` dentro del contenedor API. No uses `DATABASE_URL` en el `.env` raíz para Compose; reserva `DATABASE_URL` para `apps/api/.env` cuando ejecutes la API localmente con npm.

## Puertos publicados en el host

Docker Compose mantiene los puertos internos de los servicios, pero publica puertos distintos en tu máquina para evitar choques con el modo local. Por defecto:

```txt
API local con npm:      http://localhost:4000
API Docker publicada:   http://localhost:4001 -> api:4000
Web local con Vite:     http://localhost:5173
Web Docker publicada:   http://localhost:8080 -> web:80
PostgreSQL Docker:      localhost:5432 -> postgres:5432
PgAdmin opcional:       http://localhost:5050 -> pgadmin:80
```

Variables disponibles en el `.env` raíz:

```env
API_HOST_PORT=4001
WEB_HOST_PORT=8080
POSTGRES_HOST_PORT=5432
PGADMIN_HOST_PORT=5050
```

Si ya tienes un PostgreSQL local usando `5432`, cambia `POSTGRES_HOST_PORT` a `5433`. En ese caso, cualquier API ejecutada fuera de Docker debe usar `localhost:5433` en su `DATABASE_URL`. Dentro de Docker no cambia nada: la API sigue usando `postgres:5432`.

Si cambias `WEB_HOST_PORT`, actualiza también `CORS_ORIGIN` para que coincida con el origen público del frontend.

Si tu `.env` raíz fue creado con una versión anterior del proyecto, reemplaza las variables antiguas `API_PORT`, `WEB_PORT`, `POSTGRES_PORT` y `PGADMIN_PORT` por las variables `*_HOST_PORT`.

## Archivos de entorno

Modo Docker de desarrollo:

```bash
cp docker.env.example .env
```

Modo Docker de producción o staging:

```bash
cp docker.env.production.example .env
```

Antes de arrancar producción, cambia todos los `CHANGE_ME`, especialmente:

```txt
POSTGRES_PASSWORD
DOCKER_DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
TOKEN_HASH_PEPPER
SEED_ADMIN_PASSWORD
PGADMIN_DEFAULT_PASSWORD
```

El archivo `.env` raíz no debe commitearse.

## Validar configuración antes de arrancar

Ejecuta siempre:

```bash
npm run docker:config
```

El script ejecuta `docker compose config`.

En el servicio `api`, la salida debe contener una URL equivalente a:

```txt
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/pos_senior_db?schema=public
```

No debe contener:

```txt
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pos_senior_db?schema=public
```

Si aparece `localhost` dentro del servicio `api`, revisa que tu `.env` raíz use `DOCKER_DATABASE_URL` y no `DATABASE_URL`.

## Construcción

Para validar imágenes sin levantar servicios:

```bash
npm run docker:build
```

El script ejecuta `docker compose build api web`.

Para reconstruir sin cache cuando sospeches dependencias antiguas:

```bash
docker compose build --no-cache api web
```

## Arranque completo

Para levantar PostgreSQL, API y Web:

```bash
docker compose up -d --build postgres api web
```

Verifica estado:

```bash
docker compose ps
```

Revisa logs:

```bash
docker compose logs -f postgres
```

```bash
docker compose logs -f api
```

```bash
docker compose logs -f web
```

URLs esperadas por defecto:

```txt
Frontend/Nginx: http://localhost:8080
API directa:    http://localhost:4001
Health vía Web: http://localhost:8080/health
Health API:     http://localhost:4001/health
```

El puerto interno de la API dentro del contenedor sigue siendo `4000`; el puerto `4001` solo aplica desde tu máquina.

## Seed en contenedor

Después de levantar API y PostgreSQL, crea o actualiza el usuario administrador inicial:

```bash
docker compose exec api npm run seed:prod
```

Credenciales de desarrollo si usas `docker.env.example`:

```txt
Correo:      admin@pos.local
Contraseña:  Admin12345DevOnly
```

Cambia esa contraseña antes de usar datos reales.

## PgAdmin

PgAdmin está detrás del perfil `tools` para no levantarse por defecto.

```bash
docker compose --profile tools up -d pgadmin
```

URL:

```txt
http://localhost:5050
```

En producción, no expongas PgAdmin públicamente. Déjalo apagado, protegido por red privada/VPN o detrás de controles de acceso adicionales.

## Parada y limpieza

Detener servicios conservando datos:

```bash
docker compose down
```

Detener y borrar volumen de PostgreSQL:

```bash
docker compose down -v
```

Usa `down -v` solo cuando aceptes perder la base local de Docker.

Eliminar imágenes construidas localmente:

```bash
docker compose down --rmi local
```

## Recuperación de errores comunes

### La API no conecta a PostgreSQL

Síntomas frecuentes: healthcheck fallando, logs con `ECONNREFUSED`, `P1001` o conexión rechazada.

Revisa:

```bash
docker compose config
```

El servicio `api` debe usar `@postgres:5432`, no `@localhost:5432`.

Luego:

```bash
docker compose ps
docker compose logs postgres
docker compose logs api
```

Si PostgreSQL está sano pero la API sigue fallando, reconstruye:

```bash
docker compose build api
docker compose up -d api
```

### Puerto ocupado

Si `4001`, `5432`, `8080` o `5050` están ocupados:

```bash
docker compose ps
```

Detén servicios locales conflictivos o cambia `API_HOST_PORT`, `POSTGRES_HOST_PORT`, `WEB_HOST_PORT` o `PGADMIN_HOST_PORT` en `.env`.

Puedes ejecutar al mismo tiempo:

```bash
npm run api:dev
```

y:

```bash
docker compose up -d api
```

siempre que Docker publique la API en `API_HOST_PORT=4001` o cualquier otro puerto distinto de `4000`. Evita que dos procesos escriban al mismo tiempo sobre la misma base si estás corriendo pruebas o migraciones.

### Cambios de Prisma no aplicados

Si agregaste migraciones y la API Docker no refleja cambios:

```bash
docker compose exec api npx prisma migrate deploy
```

Luego reinicia API:

```bash
docker compose restart api
```

### Base local Docker corrupta o inconsistente

Si puedes perder datos locales:

```bash
docker compose down -v
docker compose up -d postgres
docker compose up -d --build api web
docker compose exec api npm run seed:prod
```

### Frontend no llama a la API correcta

En Docker, `VITE_API_URL` normalmente debe ser:

```env
VITE_API_URL=/api
```

Nginx sirve el frontend y proxya `/api` hacia el servicio API. Si pones una URL absoluta incorrecta, puedes introducir problemas de CORS o cookies.

## Checklist Docker antes de cerrar cambios

Ejecuta:

```bash
docker compose config
docker compose build api web
docker compose up -d postgres api web
docker compose ps
docker compose exec api npm run seed:prod
```

Después valida manualmente:

```txt
- http://localhost:8080 carga el frontend.
- http://localhost:8080/health responde OK.
- http://localhost:4001/health responde OK, salvo que hayas cambiado `API_HOST_PORT`.
- Login admin funciona.
- Productos, ventas y reportes cargan sin errores 401/403/500.
```

Finalmente, si no necesitas dejar los servicios activos:

```bash
docker compose down
```

## Relación con E2E integrado

`npm run web:e2e:integration` usa PostgreSQL de Docker, pero ejecuta API y Web con npm en puertos aislados `4010` y `5175`. No es lo mismo que `docker compose up api web`.

El E2E integrado usa el schema `e2e` y resetea esa base antes de correr. El modo Docker normal usa el schema `public` salvo que cambies explícitamente `DOCKER_DATABASE_URL`.
