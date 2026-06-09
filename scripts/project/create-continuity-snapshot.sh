#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

printf '%s\n' 'Using Node snapshot generator: scripts/project/create-continuity-snapshot.js' >&2
node scripts/project/create-continuity-snapshot.js "$@"
