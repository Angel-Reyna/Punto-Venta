# Revisión arquitectónica

## Decisión

Monorepo con `apps/api` y `apps/web`. La API concentra reglas de negocio, seguridad, transacciones y auditoría. El frontend no calcula estados críticos de inventario ni ventas; solo presenta información y envía comandos.

## Pros

- Separación clara de responsabilidades.
- PostgreSQL con Prisma permite migraciones controladas y consultas tipadas.
- JWT permite integración sencilla con frontend y despliegue desacoplado.
- Auditoría explícita por operación crítica.
- Transacciones para venta e inventario, evitando inconsistencias.
- Desactivación lógica de productos y usuarios, preservando historial.

## Contras

- JWT sin tabla de refresh tokens no permite revocación granular por dispositivo.
- El PDF es básico; para formatos complejos conviene usar HTML + Puppeteer.
- No incluye pagos, impuestos ni facturación electrónica.
- No incluye multi-sucursal ni multi-almacén.
- No incluye CI/CD ni infraestructura AWS como código.

## Siguiente nivel producción

1. Guardar refresh tokens hasheados en base de datos.
2. Usar AWS Secrets Manager para secretos.
3. Agregar logs estructurados con pino.
4. Agregar observabilidad con CloudWatch.
5. Agregar tests de integración con base de datos temporal.
6. Agregar backups automáticos en RDS.
7. Agregar pipeline GitHub Actions.
8. Separar permisos finos por acción, no solo por rol.
