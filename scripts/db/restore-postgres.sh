#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <backup-file.dump>" >&2
  exit 1
fi

COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
SERVICE=${POSTGRES_SERVICE:-postgres}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-pos_senior_db}
BACKUP_FILE=$1
CONTAINER_BACKUP=/tmp/punta_venta_restore.dump

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "Restoring ${BACKUP_FILE} into database ${POSTGRES_DB}"
echo "This will drop and recreate the public schema. Press Ctrl+C within 5 seconds to abort."
sleep 5

cat "${BACKUP_FILE}" | docker compose -f "${COMPOSE_FILE}" exec -T "${SERVICE}" sh -c "cat > '${CONTAINER_BACKUP}'"

docker compose -f "${COMPOSE_FILE}" exec -T "${SERVICE}" sh -c "psql -U '${POSTGRES_USER}' -d '${POSTGRES_DB}' -v ON_ERROR_STOP=1 -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;' && pg_restore -U '${POSTGRES_USER}' -d '${POSTGRES_DB}' --no-owner --no-acl '${CONTAINER_BACKUP}' && rm -f '${CONTAINER_BACKUP}'"

echo "Restore completed. Restart the API container if it was running."
