# Revisión arquitectónica

## Decisión

Monorepo con `apps/api` y `apps/web`. La API concentra reglas de negocio, seguridad, transacciones, auditoría y persistencia. El frontend no calcula estados críticos de inventario, caja ni ventas; solo presenta información y envía comandos a la API.

## Estado implementado

- Backend Node.js + Express + TypeScript con módulos por dominio.
- PostgreSQL con Prisma, schema versionado y migraciones.
- Autenticación con JWT access token y refresh token en cookie `httpOnly`.
- Refresh sessions persistidas en base de datos mediante hashes, expiración, revocación y reemplazo de sesión.
- Middleware de autenticación, autorización por rol (`ADMIN`, `CASHIER`), base de permisos por acción y protección CSRF para endpoints que dependen de cookies de sesión.
- Validación de entrada con Zod en rutas críticas.
- Manejo centralizado de errores y logging con request id.
- Transacciones para operaciones sensibles de ventas, inventario y caja.
- Auditoría para operaciones críticas.
- Frontend React + Vite + TypeScript con rutas protegidas, interceptor HTTP y refresh automático.
- Docker Compose para PostgreSQL, API, frontend con Nginx y PgAdmin opcional.
- CI con GitHub Actions para validación Prisma, migraciones contra PostgreSQL real, build/test de API, build de frontend y build de imágenes Docker.
- Guardrails de desarrollo local para detectar conflictos Docker/API local, configuración CORS/cookies, Prisma, seed y usuario administrador.
- Scripts de backup y restauración de PostgreSQL.

## Fortalezas actuales

- Separación base entre API, frontend e infraestructura local.
- Refresh tokens no se guardan en claro.
- El access token se mantiene en memoria en el frontend, reduciendo exposición frente a XSS persistente.
- Hay revocación de sesiones, rotación de refresh token y protección CSRF double-submit con token firmado.
- Las operaciones de inventario y venta están modeladas como operaciones de negocio, no como simples CRUD.
- Docker y CI ya existen, por lo que el proyecto puede evolucionar con validación automatizada.

## Limitaciones actuales

- La autorización ya tiene una base de permisos derivados del rol actual y los módulos de usuarios, productos, inventario y ventas usan permisos por acción. Aún faltan migrar caja, reportes, auditoría y dashboard de `requireRole` a `requirePermission`.
- La política de cookie de refresh (`secure`, `sameSite`, `domain`) ya es configurable por entorno. Si producción usa subdominios separados, `COOKIE_DOMAIN` debe configurarse para que el frontend pueda leer la cookie CSRF no sensible.
- El frontend tiene infraestructura de test, pero faltan pruebas de componentes y flujos críticos.
- La importación de Excel usa `exceljs` para archivos `.xlsx` y aplica límites de tamaño, filas, columnas y encabezados. Se eliminó la dependencia runtime vulnerable `xlsx`.
- La documentación de producción todavía debe completarse con estrategia final de secretos, dominios, TLS, backups gestionados y observabilidad.
- El entorno local ahora tiene doctor/preflight, pero esos guardrails no reemplazan monitoreo, health checks externos ni gestión real de secretos en producción.

## Siguiente nivel producción

1. Confirmar el baseline local con scripts del monorepo: `npm run api:prisma:generate`, `npm run api:build`, `npm run api:test` y `npm run web:build`.
2. Migrar progresivamente el resto de módulos a `requirePermission` y definir una matriz formal de permisos por rol.
3. Añadir pruebas frontend para auth, rutas protegidas y formularios críticos.
4. Evolucionar logging hacia una solución estructurada de producción y agregar métricas/tracing.
5. Mover secretos productivos a un gestor dedicado como AWS Secrets Manager o equivalente.
6. Separar migraciones de base de datos como job explícito en despliegues productivos críticos.
