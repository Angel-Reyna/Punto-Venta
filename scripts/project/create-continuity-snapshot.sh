#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR=".puntaventa_diagnostics"
LOG="$OUT_DIR/punta-venta-current-diagnostics-$STAMP.txt"
HANDOFF="$OUT_DIR/punta-venta-continuity-$STAMP.md"
ARCHIVE="$OUT_DIR/Punta_Venta_current_$STAMP.tar.gz"
RUN_QA="false"

for arg in "$@"; do
  case "$arg" in
    --with-qa)
      RUN_QA="true"
      ;;
    --help|-h)
      cat <<'HELP'
Usage:
  bash scripts/project/create-continuity-snapshot.sh [--with-qa]

Creates a continuity bundle under .puntaventa_diagnostics/:
  - diagnostics log
  - next-chat handoff markdown
  - sanitized project tar.gz

Options:
  --with-qa   Run the main validation commands and include their output in the log.
HELP
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

mkdir -p "$OUT_DIR"

run() {
  echo
  echo "============================================================"
  echo "\$ $*"
  echo "============================================================"
  "$@"
  local code=$?
  echo
  echo "EXIT_CODE=$code"
  return 0
}

{
  echo "PUNTA VENTA CURRENT DIAGNOSTICS"
  echo "DATE: $(date)"
  echo "PWD: $(pwd)"
  echo "RUN_QA: $RUN_QA"
  echo

  run git status --short --untracked-files=all
  run git log --oneline -30
  run git diff --stat
  run git diff --check
  run node -v
  run npm -v
  run docker --version
  run docker compose version

  if [ "$RUN_QA" = "true" ]; then
    run npm run ci:validate-lockfiles
    run npm run api:prisma:validate
    run npm run api:build
    run npm run api:test:critical
    run npm run web:build
    run node scripts/web/audit-bundle.js
    run npm run web:test
    run npm run web:e2e
    run npm run web:e2e:integration
    run npm run docker:config
    run npm run docker:build
  else
    echo
    echo "QA commands skipped. Re-run with --with-qa to include validation output."
  fi

  echo
  echo "============================================================"
  echo "PROJECT STRUCTURE"
  echo "============================================================"
  find apps/api/src -maxdepth 4 -type f | sort
  echo
  find apps/web/src -maxdepth 4 -type f | sort
  echo
  find docs -maxdepth 4 -type f | sort 2>/dev/null || true
  echo
  find scripts -maxdepth 4 -type f | sort 2>/dev/null || true
} 2>&1 | tee "$LOG"

NOW_TEXT="$(date)"
ARCHIVE_BASENAME="$(basename "$ARCHIVE")"
LOG_BASENAME="$(basename "$LOG")"
HANDOFF_BASENAME="$(basename "$HANDOFF")"

cat > "$HANDOFF" <<'EOF_HANDOFF'
# Punta Venta — Handoff para nuevo chat

Generado: __NOW_TEXT__
Ruta local: `C:\Users\drago\Proyectos\Punta_Venta`
Snapshot: `__ARCHIVE__`
Diagnóstico: `__LOG__`

## Mensaje para pegar

Estoy continuando el proyecto Punta Venta desde un snapshot actual del repo.

Adjunto:
- `__ARCHIVE_BASENAME__`
- `__LOG_BASENAME__`
- `__HANDOFF_BASENAME__`

Reconstruye el estado real desde los adjuntos, sin asumir código viejo ni generar cambios a ciegas.

Modelo funcional obligatorio:
Punta Venta no es un POS clásico dependiente de caja abierta. El flujo correcto es admin/dueño + vendedores. La venta en efectivo no debe depender de caja abierta. CASHIER se conserva como enum técnico, pero en UI/documentación debe tratarse como Vendedor.

Estado esperado:
Ya quedaron aplicados los patches 50a–70: cobertura E2E/API, auditoría operativa, actividad de vendedores con auto-refresh, eliminación física de productos con historial preservado, refactor backend modular, docs de arquitectura, guardrails de bundle y guardrails de calidad de patches.

Reglas para próximos patches:
- Patches pequeños, numerados y con objetivo único.
- No mezclar refactor con features.
- No cambiar contratos HTTP sin advertirlo.
- Validar con `git apply --check --whitespace=error`, `git diff --check` y `git diff --name-status`.
- Verificar que archivos nuevos estén incluidos.
- Mantener compatibilidad Windows/Git Bash.
- Para E2E usar `data-testid` en controles críticos y locators scoped.

Comandos base:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run ci:validate-lockfiles
npm run api:prisma:validate
npm run api:build
npm run api:test:critical
npm run web:build
node scripts/web/audit-bundle.js
npm run web:test
npm run web:e2e
```

Validación completa:

```bash
npm run web:e2e:integration
npm run docker:config
npm run docker:build
```

Siguiente etapa recomendada:
Primero auditar el snapshot. No continuar refactorizando por inercia. Prioridades probables: QA/release local, responsive real, optimización frontend puntual, CI/CD/deploy, o nuevas features bien delimitadas.
EOF_HANDOFF

python3 - "$HANDOFF" "$NOW_TEXT" "$ARCHIVE" "$LOG" "$ARCHIVE_BASENAME" "$LOG_BASENAME" "$HANDOFF_BASENAME" <<'PY_REPLACE'
from pathlib import Path
import sys
path = Path(sys.argv[1])
replacements = {
    "__NOW_TEXT__": sys.argv[2],
    "__ARCHIVE__": sys.argv[3],
    "__LOG__": sys.argv[4],
    "__ARCHIVE_BASENAME__": sys.argv[5],
    "__LOG_BASENAME__": sys.argv[6],
    "__HANDOFF_BASENAME__": sys.argv[7],
}
text = path.read_text()
for key, value in replacements.items():
    text = text.replace(key, value)
path.write_text(text)
PY_REPLACE

tar \
  --exclude="./.git" \
  --exclude="./node_modules" \
  --exclude="./apps/api/node_modules" \
  --exclude="./apps/web/node_modules" \
  --exclude="./dist" \
  --exclude="./apps/api/dist" \
  --exclude="./apps/web/dist" \
  --exclude="./coverage" \
  --exclude="./apps/api/coverage" \
  --exclude="./apps/web/coverage" \
  --exclude="./test-results" \
  --exclude="./apps/web/test-results" \
  --exclude="./playwright-report" \
  --exclude="./apps/web/playwright-report" \
  --exclude="./.puntaventa_diagnostics" \
  --exclude="./.env" \
  --exclude="./.env.*" \
  --exclude=".env" \
  --exclude=".env.*" \
  --exclude="*/.env" \
  --exclude="*/.env.*" \
  --exclude="./*.log" \
  --exclude="*.tsbuildinfo" \
  --exclude="./$OUT_DIR/*.tar.gz" \
  -czf "$ARCHIVE" .

cat <<EOF_DONE

Continuity files generated:
$HANDOFF
$LOG
$ARCHIVE

Attach these files in the next chat.
EOF_DONE
