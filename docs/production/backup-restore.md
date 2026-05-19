# Backup y restauración de PostgreSQL

Este proyecto incluye scripts mínimos para respaldar y restaurar la base de datos usada por Docker Compose.

Los backups se guardan localmente en `backups/` y no se versionan en Git.

## Crear un backup

Desde la raíz del proyecto:

```bash
./scripts/db/backup-postgres.sh
```

El archivo generado tendrá formato custom de PostgreSQL:

```txt
backups/punta_venta_<database>_YYYYMMDD_HHMMSS.dump
```

Puedes sobrescribir variables cuando tu `.env` use otros nombres:

```bash
POSTGRES_USER=punta_venta POSTGRES_DB=punta_venta ./scripts/db/backup-postgres.sh
```

## Restaurar un backup

La restauración elimina y recrea el schema `public`, por lo que reemplaza los datos actuales.

```bash
./scripts/db/restore-postgres.sh backups/punta_venta_punta_venta_20260518_220000.dump
```

Después de restaurar, reinicia la API:

```bash
docker compose restart api
```

## Recomendaciones de producción

- Ejecuta backups automáticos fuera del contenedor, por ejemplo con cron del servidor.
- Copia backups a almacenamiento externo; no los dejes solo en el servidor.
- Prueba restauraciones periódicamente en un ambiente separado.
- Protege los backups como datos sensibles: contienen usuarios, ventas, productos y auditoría.
- Define una política de retención, por ejemplo diaria por 14 días, semanal por 8 semanas y mensual por 12 meses.
