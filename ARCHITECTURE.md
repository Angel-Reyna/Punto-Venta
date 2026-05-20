# Revisión arquitectónica

## Decisión

Monorepo con `apps/api` y `apps/web`. La API concentra reglas de negocio, seguridad, transacciones, auditoría y persistencia. El frontend no calcula estados críticos de inventario, caja ni ventas; solo presenta información y envía comandos a la API.

## Estado implementado

- Backend Node.js + Express + TypeScript con módulos por dominio.
- PostgreSQL con Prisma, schema versionado y migraciones.
- Autenticación con JWT access token y refresh token en cookie `httpOnly`.
- Refresh sessions persistidas en base de datos mediante hashes, expiración, revocación y reemplazo de sesión.
- Middleware de autenticación y autorización por rol (`ADMIN`, `CASHIER`).
- Validación de entrada con Zod en rutas críticas.
- Manejo centralizado de errores y logging con request id.
- Transacciones para operaciones sensibles de ventas, inventario y caja.
- Auditoría para operaciones críticas.
- Frontend React + Vite + TypeScript con rutas protegidas, interceptor HTTP y refresh automático.
- Docker Compose para PostgreSQL, API, frontend con Nginx y PgAdmin opcional.
- CI con GitHub Actions para validación Prisma, migraciones contra PostgreSQL real, build/test de API, build de frontend y build de imágenes Docker.
- Scripts de backup y restauración de PostgreSQL.

## Fortalezas actuales

- Separación base entre API, frontend e infraestructura local.
- Refresh tokens no se guardan en claro.
- El access token se mantiene en memoria en el frontend, reduciendo exposición frente a XSS persistente.
- Hay revocación de sesiones y rotación de refresh token.
- Las operaciones de inventario y venta están modeladas como operaciones de negocio, no como simples CRUD.
- Docker y CI ya existen, por lo que el proyecto puede evolucionar con validación automatizada.

## Limitaciones actuales

- La autorización todavía es coarse-grained: solo existen roles `ADMIN` y `CASHIER`, sin permisos granulares por acción.
- La política de cookie de refresh (`secure`, `sameSite`, `domain`) ya es configurable por entorno; si producción usa `SameSite=None`, sigue pendiente añadir protección CSRF explícita.
- El frontend tiene infraestructura de test, pero faltan pruebas de componentes y flujos críticos.
- La importación de Excel usa `exceljs` para archivos `.xlsx` y aplica límites de tamaño, filas, columnas y encabezados. Se eliminó la dependencia runtime vulnerable `xlsx`.
- La documentación de producción todavía debe completarse con estrategia final de secretos, dominios, TLS, backups gestionados y observabilidad.

## Siguiente nivel producción

1. Confirmar el baseline local con scripts del monorepo: `npm run api:prisma:generate`, `npm run api:build`, `npm run api:test` y `npm run web:build`.
2. Añadir protección CSRF para endpoints que aceptan cookies si el despliegue requiere cookies cross-site (`COOKIE_SAME_SITE=none`).
3. Introducir autorización granular por permisos sin romper los roles actuales.
4. Añadir pruebas frontend para auth, rutas protegidas y formularios críticos.
5. Evolucionar logging hacia una solución estructurada de producción y agregar métricas/tracing.
6. Mover secretos productivos a un gestor dedicado como AWS Secrets Manager o equivalente.
7. Separar migraciones de base de datos como job explícito en despliegues productivos críticos.
