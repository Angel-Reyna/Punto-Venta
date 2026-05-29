# Arquitectura de Punta Venta

## Decisión base

Punta Venta es un monorepo con dos aplicaciones principales:

```txt
apps/api  -> API Express + Prisma + PostgreSQL
apps/web  -> Web React/Vite
```

La API concentra reglas de negocio, autorización, transacciones, auditoría y persistencia. El frontend no calcula estados críticos de inventario, ventas, devoluciones ni permisos; presenta información y envía comandos a endpoints protegidos.

El modelo funcional actual no obliga a abrir caja para vender. El flujo principal es vendedor → venta física reportada → inventario descontado → administrador consulta reportes y actividad.

## Capas actuales

### Backend

- Express + TypeScript.
- Prisma como ORM sobre PostgreSQL.
- Módulos por dominio: auth, usuarios, productos, inventario, ventas, reportes, dashboard, auditoría, actividad de vendedores y caja.
- Estructura modular documentada en `docs/architecture/backend-modules.md`: rutas para transporte HTTP, servicios para casos de uso, archivos `shared` para schemas/tipos, `mappers` para DTOs y archivos especializados cuando el dominio lo justifica.
- Validación de entrada con Zod en rutas críticas.
- Middleware centralizado de autenticación, autorización, CSRF, rate limit, request id y errores.
- Transacciones Prisma para operaciones sensibles de venta, inventario, devolución y caja.
- Auditoría para operaciones críticas con redacción de datos sensibles.
- Refresh sessions persistidas mediante hash, expiración, revocación y reemplazo.

### Frontend

- React + Vite + TypeScript.
- Material UI para layout, formularios, cards y tablas.
- Rutas protegidas por autenticación y permisos efectivos recibidos desde backend.
- Access token en memoria y refresh token en cookie `httpOnly`.
- Interceptor HTTP para refresh y manejo de errores.
- Pantallas adaptadas a responsive real mediante cards/listas/tablas según módulo.
- API clients de frontend centralizados en `apps/web/src/api/http.ts` y contratos de paginación/queries en `apps/web/src/api/contracts.ts`.
- Features organizadas por dominio con hooks de datos y componentes presentacionales separados.

### Infraestructura local

- Docker Compose para PostgreSQL, API, Web/Nginx y PgAdmin opcional.
- Modo local recomendado: PostgreSQL en Docker; API y Web por npm.
- Modo Docker completo: API usa `DOCKER_DATABASE_URL` con host interno `postgres`.
- Runner E2E integrado con API real, Web real y schema PostgreSQL `e2e` descartable.

## Seguridad implementada

- JWT access token de vida corta.
- Refresh token en cookie `httpOnly`.
- CSRF double-submit para endpoints que dependen de cookies de sesión.
- Hash de refresh tokens con pepper.
- Revocación de sesiones en logout, rotación de refresh, cambio de rol, reset de contraseña y desactivación de usuario.
- Rate limiting en autenticación y API general.
- Helmet y CORS configurables por entorno.
- Permisos efectivos derivados del rol y validados en backend.
- Registro de intentos no autorizados de vendedores.
- Redacción centralizada de contraseñas, tokens, cookies, secretos, credenciales y headers de autorización antes de persistir auditoría o actividad.

## Autorización

Roles persistidos:

```txt
ADMIN
CASHIER
```

`CASHIER` se conserva como nombre técnico del enum por compatibilidad de migraciones, pero en UI y documentación funcional se presenta como vendedor.

La autorización usa permisos por acción para los módulos principales: usuarios, productos, inventario, ventas, caja, reportes, dashboard, auditoría y actividad de vendedores. Quedan rutas puntuales de auth administrativo que todavía usan control por rol explícito cuando el endpoint está semánticamente ligado al rol `ADMIN`.

## Pruebas y calidad

- Jest cubre servicios y rutas críticas de API.
- Vitest cubre permisos y navegación frontend.
- Playwright mockeado valida navegación, permisos visuales, responsive y flujo básico de venta sin backend real.
- Playwright integrado valida login real, venta real, descuento de inventario real y validación de reportes con admin.
- CI valida lockfiles, Prisma, migraciones contra PostgreSQL real, tests, builds y Docker build.
- Fixtures E2E reutilizables reducen datos hardcodeados y mejoran estabilidad de flujos mockeados/integrados.

## Fortalezas actuales

- Separación clara entre frontend, API e infraestructura.
- Operaciones críticas modeladas como reglas de negocio, no como CRUD plano.
- Tokens refresh no se almacenan en claro.
- Buen baseline de pruebas críticas y E2E real.
- Reportes conservan costos históricos, utilidad bruta y snapshots de producto eliminado.
- Docker y documentación operativa están separados entre modo local y modo contenedor.
- Los scripts `qa:local` y `qa:full` reducen errores manuales al validar patches.

## Arquitectura backend modular

Después de los refactors por dominio, el backend usa una convención explícita por módulo:

```txt
<module>.routes.ts   -> transporte HTTP, middlewares, permisos, validación y respuestas.
<module>.service.ts  -> casos de uso, transacciones, reglas de dominio y coordinación Prisma.
<module>.shared.ts   -> schemas Zod, tipos, constantes y helpers puros.
<module>.mappers.ts  -> includes/selects Prisma, tipos derivados y transformación a DTOs.
<module>.<area>.ts   -> subflujos especializados como importación, cookies, stock u operaciones.
```

La referencia operativa está en `docs/architecture/backend-modules.md`. Ese documento debe actualizarse cuando se agregue un módulo, se mueva un schema Zod, cambie un mapper público o se modifique una regla transversal de transacciones, auditoría, permisos o snapshots históricos.

## Riesgos actuales y siguientes mejoras

1. **Caja sigue siendo módulo secundario**: el dominio existe, pero el modelo de negocio actual prioriza ventas por vendedor. Si se requiere control de efectivo real, debería evolucionar hacia liquidaciones/entregas de efectivo, no forzar caja abierta para vender.
2. **RBAC editable**: los permisos aún se derivan del rol en código. Para producción multiempresa o administración granular, conviene persistir permisos/roles en base de datos.
3. **Paginación server-side uniforme**: existen utilidades de paginación y varios endpoints ya la usan, pero conviene extenderla de forma consistente antes de manejar volúmenes altos.
4. **Observabilidad**: existe logging base con request id, pero falta logging estructurado completo, métricas y tracing con destino externo.
5. **Presupuesto de bundle**: el guardrail de bundle es informativo por defecto. Conviene ajustar umbrales con datos reales y convertir ciertos avisos en bloqueo cuando la app se acerque a producción.
6. **Dependencias de importación**: revisar periódicamente `multer`/uploads y límites de Excel para mantener superficie de ataque baja.
7. **Node local**: el proyecto declara Node 22. Los entornos locales deberían alinearse para evitar diferencias con CI/Docker.

## Criterio para nuevos módulos

Antes de añadir código nuevo:

- definir permisos backend y frontend;
- agregar validación Zod;
- revisar transacciones si modifica dinero, inventario o usuarios;
- agregar pruebas unitarias/servicio para reglas críticas;
- agregar E2E mockeado si cambia navegación/UX;
- agregar E2E integrado si cruza API + DB + Web en flujo crítico;
- documentar variables o comandos nuevos en `docs/`.
