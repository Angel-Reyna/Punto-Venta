# Punta Venta — continuidad para nuevo chat

Ruta local habitual: `C:\Users\drago\Proyectos\Punta_Venta`.
Shell habitual: Git Bash en Windows.

Este documento define cómo cerrar una ronda y abrir otro chat sin perder el estado real del repositorio. La fuente de verdad debe ser el repositorio Git más el snapshot generado; no la memoria del chat ni patches antiguos.

## Cuándo cambiar de chat

Abre un chat nuevo cuando:

- el chat actual empiece a responder lento;
- ya haya muchos patches, logs o adjuntos;
- se cierre una ronda grande de trabajo;
- se vaya a iniciar una etapa distinta;
- se necesite adjuntar un snapshot limpio del repo.

Antes de cambiar, deja cada patch commiteado y valida que `git --no-pager status --short --untracked-files=all` esté limpio.

## Modelo funcional vigente

Punta Venta no es un POS clásico dependiente de caja.

Modelo correcto:

- Admin/dueño gestiona productos, inventario, usuarios, reportes, auditoría y actividad.
- Vendedores registran ventas físicas en la app.
- La venta en efectivo no depende de caja abierta ni de control de efectivo.
- `CASHIER` puede seguir existiendo como enum técnico heredado, pero en UI y documentación funcional debe entenderse como `Vendedor`.
- El stock físico asignado a vendedores es el stock vendible para vendedores; el almacén principal requiere retiro/aprobación antes de venta por vendedor.

## Estado reciente esperado

Antes de generar este documento, la ronda reciente dejó cerrados estos bloques:

- Stock físico de vendedores exigido desde backend para ventas.
- Código de producto automático, etiqueta “Margen de ganancia” y generador de Excel demo.
- Cancelación segura de ventas parcialmente devueltas mediante devolución restante.
- Reportes con métricas contables netas más claras.
- Auditoría con filtros humanos por módulo.
- Ajustes responsive finos.
- Índices operativos Prisma/PostgreSQL y retries controlados en transacciones serializables.
- Limpieza de snapshots para no adjuntar `.env`, dependencias, builds ni artefactos locales.

El siguiente chat debe confirmar estos puntos desde `git --no-pager log --oneline`, no asumirlos.

## Validación final recomendada

Con proyecto local bajado o levantado para validación no Docker:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run clean:generated
npm run qa:guardrails
npm run api:prisma:validate
npm run api:prisma:generate
npm --prefix apps/api run prisma:migrate:deploy
npm run api:build
npm run api:test:critical
npm run web:lint
npm run web:build
npm run web:e2e
```

Para Docker completo, usa proyecto local bajado para evitar conflictos de puertos:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run docker:config
npm run docker:build
docker compose up -d postgres api web
docker compose ps
curl -f http://localhost:4001/health
curl -I http://localhost:8080
```

## Generar snapshot para el próximo chat

Usa el script Node, no comandos manuales largos:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run project:snapshot
```

Para incluir QA en el diagnóstico:

```bash
npm run project:snapshot:qa
```

El script limpia `.puntaventa_diagnostics/` antes de generar nuevos archivos y crea:

- `punta-venta-continuity-YYYYMMDD-HHMMSS.md`;
- `punta-venta-current-diagnostics-YYYYMMDD-HHMMSS.txt`;
- `Punta_Venta_current_YYYYMMDD-HHMMSS.tar.gz`.

Cuando el árbol Git está limpio, el snapshot usa `git archive HEAD`; por eso no incluye `.env`, `node_modules`, builds, reportes de Playwright ni archivos locales ignorados.

## Mensaje inicial para pegar en el nuevo chat

```text
Estoy continuando el proyecto Punta Venta desde un snapshot actual del repositorio.

Adjunto:
- Punta_Venta_current_YYYYMMDD-HHMMSS.tar.gz
- punta-venta-current-diagnostics-YYYYMMDD-HHMMSS.txt
- punta-venta-continuity-YYYYMMDD-HHMMSS.md

Ruta local:
C:\Users\drago\Proyectos\Punta_Venta

Primero reconstruye el estado real desde los adjuntos. No asumas código viejo ni generes patches antes de revisar el snapshot.

Reglas:
- Español.
- Comandos autocerrables; usar git --no-pager.
- Indicar si el proyecto debe estar levantado o bajado.
- Antes de generar nuevos diagnósticos/snapshots/patches, limpiar temporales previos.
- No crear scripts .sh ni .bak nuevos.
- Patches pequeños, con git apply --check --whitespace=error y git diff --check.

Modelo funcional:
Punta Venta no es POS dependiente de caja. Admin gestiona; vendedores venden desde stock físico asignado. CASHIER es enum técnico heredado y en UI equivale a Vendedor.

Comandos base:
cd "/c/Users/drago/Proyectos/Punta_Venta"

git --no-pager status --short --untracked-files=all
git --no-pager log --oneline -20
npm run qa:guardrails
npm run api:prisma:validate
npm run api:build
npm run api:test:critical
npm run web:build
npm run web:e2e
```

## Reglas para el próximo asistente

1. Leer snapshot y diagnóstico.
2. Confirmar estado Git y validaciones.
3. Identificar cambios sin commit.
4. Proponer un patch pequeño o un diagnóstico concreto.
5. Generar patch solo si el estado lo permite.
6. Verificar archivos nuevos incluidos en el patch.

Detén la generación de patches y valida si aparece cualquiera de estos casos:

- `api:build` falla;
- `api:test:critical` falla;
- `web:e2e` falla por selector ambiguo;
- `web:e2e:integration` falla por datos reales;
- `git --no-pager diff --check` muestra whitespace;
- `git apply --check --whitespace=error` falla;
- un import apunta a un archivo nuevo no incluido;
- el patch modifica demasiadas capas sin justificación.
