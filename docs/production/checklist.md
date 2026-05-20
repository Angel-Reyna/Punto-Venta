# Checklist de producción

Antes de usar Punta Venta con datos reales, valida esta lista.

## Variables y secretos

- `API_NODE_ENV=production`.
- `CORS_ORIGIN` apunta al dominio real con HTTPS.
- `COOKIE_SECURE=true` en producción.
- `COOKIE_SAME_SITE=lax` si web y API comparten dominio con reverse proxy; `none` solo si son dominios distintos y hay CSRF explícito.
- `COOKIE_DOMAIN` está vacío salvo que el despliegue requiera compartir cookie entre subdominios controlados.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` y `TOKEN_HASH_PEPPER` son únicos, largos y aleatorios.
- `POSTGRES_PASSWORD` no usa valores de desarrollo.
- `SEED_ADMIN_PASSWORD` solo se usa para el bootstrap inicial y se rota después del primer login.
- `.env` no está versionado en Git.

## Base de datos

- `npx prisma migrate deploy` corre correctamente en el contenedor API.
- Existe backup probado con `scripts/db/backup-postgres.sh`.
- Existe restore probado en ambiente separado.
- El volumen de PostgreSQL está persistido y monitoreado.

## Seguridad HTTP

- La app se sirve por HTTPS.
- Cookies `Secure` activas mediante `COOKIE_SECURE=true`.
- Política `SameSite` revisada según el modelo de dominio final.
- CORS cerrado al dominio real.
- Rate limits activos para auth y API general.
- Logs no imprimen secretos, tokens ni contraseñas.

## Operación

- Se creó el usuario administrador inicial con variables de entorno seguras.
- Se cambió la contraseña temporal del administrador.
- PgAdmin no queda expuesto públicamente.
- Los logs de API y PostgreSQL se revisan después del primer arranque.
- Se probó login, venta, devolución, cierre de caja y reporte operativo.

## GitHub Actions

- El workflow de CI pasa en `main`.
- Backend compila y tests pasan.
- Frontend compila.
- Imágenes Docker construyen.
