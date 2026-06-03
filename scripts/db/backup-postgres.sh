#!/usr/bin/env sh
set -eu

COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
SERVICE=${POSTGRES_SERVICE:-postgres}
BACKUP_DIR=${BACKUP_DIR:-backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-pos_senior_db}
OUTPUT_FILE="${BACKUP_DIR}/punta_venta_${POSTGRES_DB}_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "Creating PostgreSQL backup: ${OUTPUT_FILE}"
docker compose -f "${COMPOSE_FILE}" exec -T "${SERVICE}" \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --format=custom --no-owner --no-acl \
  > "${OUTPUT_FILE}"

if [ ! -s "${OUTPUT_FILE}" ]; then
  echo "Backup file was not created or is empty: ${OUTPUT_FILE}" >&2
  exit 1
fi

echo "Backup completed: ${OUTPUT_FILE}"
