# QA de uso real con base demo

Esta guía cierra el bloque de datos demo de Punta Venta. Sirve para comprobar que la base sembrada con `api:seed:demo-usage` tiene suficiente volumen y coherencia para probar reportes, inventario, ventas, auditoría, actividad de vendedores y dashboard.

No ejecutes estos comandos sobre una base productiva real.

## 1. Preparar la base demo

Ejecutar con la app local detenida. Solo Postgres debe estar arriba.

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

docker compose up -d postgres
docker compose stop api web

npm run api:seed:demo-usage -- --days=60 --reset-demo --seed=punta-demo-60
```

## 2. Validar la coherencia de datos demo

Ejecutar con Postgres arriba. API/Web pueden permanecer detenidos.

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run api:validate:demo-usage -- --days=60
```

La validación revisa:

- usuarios demo y tres vendedores;
- catálogo demo suficiente;
- almacenes centrales y almacenes de vendedores;
- volumen mínimo de ventas;
- tickets con partidas y pagos;
- ventas con almacén de salida;
- devoluciones/cancelaciones aprobadas;
- solicitudes pendientes de ajustes de venta;
- transferencias/retiros de stock;
- merma por caducidad;
- auditoría;
- actividad de vendedores;
- ausencia de balances negativos.

Para salida JSON:

```bash
npm run api:validate:demo-usage -- --days=60 --json
```

Para exigir más volumen de ventas:

```bash
npm run api:validate:demo-usage -- --days=60 --min-sales=300
```

## 3. Levantar la app

Ejecutar después de sembrar y validar la base.

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

docker compose up -d --build api web
docker compose ps
curl -f http://localhost:4001/health
curl -I http://localhost:8080
docker inspect punta_venta_web --format "{{.State.Health.Status}}"
```

## 4. Validación manual principal

Entrar a `http://localhost:8080`.

Credenciales demo:

```text
Admin:    demo.admin@demo.puntaventa.local
Vendedor: demo.vendedor.norte@demo.puntaventa.local
Vendedor: demo.vendedor.centro@demo.puntaventa.local
Vendedor: demo.vendedor.ruta@demo.puntaventa.local
Password: Demo12345DevOnly
```

### Reportes

Como admin:

- Consultar este mes.
- Consultar mes pasado.
- Consultar últimos 60 días.
- Revisar puente financiero.
- Revisar tendencia diaria de venta neta.
- Revisar venta neta por vendedor.
- Revisar Pareto de merma por producto.
- Confirmar que la utilidad operativa descuenta merma por caducidad.
- Confirmar que el PDF solo se descarga después de consultar datos.

### Inventario

Como admin:

- Revisar stock central.
- Revisar stock con vendedores.
- Revisar productos en riesgo.
- Revisar solicitudes de retiro pendientes.
- Aprobar una solicitud de retiro y validar movimientos.
- Confirmar que no haya saldos negativos.

### Ventas

Como vendedor:

- Crear una venta desde almacén asignado.
- Intentar vender más del stock disponible.
- Solicitar una devolución.
- Confirmar que la solicitud queda pendiente.

Como admin:

- Aprobar o rechazar la solicitud.
- Confirmar cambio en venta, inventario y auditoría.

### Auditoría y actividad

Como admin:

- Probar accesos rápidos de fecha.
- Filtrar por responsable.
- Filtrar por acción.
- Revisar señales operativas de actividad de vendedores.

### Dashboard

Como admin y vendedor:

- Revisar señales operativas.
- Comparar últimos 7 días contra periodo anterior.
- Comparar mes actual contra mes anterior.
- Revisar riesgo de inventario cuando aplique.

## 5. Validación automática del proyecto

La app local puede estar detenida; `web:e2e` levanta su propio servidor.

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

npm run ci:check-test-guardrails
npm run api:build
npm run api:test:critical
npm run web:lint
npm run web:build
npm run web:e2e
```

## 6. Capturar evidencia

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

mkdir -p .puntaventa_diagnostics
STAMP=$(date +%Y%m%d-%H%M%S)

git --no-pager status --short --untracked-files=all > ".puntaventa_diagnostics/status-after-demo-qa-$STAMP.txt"
git --no-pager log --oneline -25 > ".puntaventa_diagnostics/log-after-demo-qa-$STAMP.txt"
docker compose ps > ".puntaventa_diagnostics/docker-ps-after-demo-qa-$STAMP.txt"
curl -f http://localhost:4001/health > ".puntaventa_diagnostics/api-health-after-demo-qa-$STAMP.txt"
curl -I http://localhost:8080 > ".puntaventa_diagnostics/web-head-after-demo-qa-$STAMP.txt"
npm run api:validate:demo-usage -- --days=60 --json > ".puntaventa_diagnostics/demo-usage-validation-$STAMP.json"
```

## 7. Limpieza de diagnósticos

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

rm -f .puntaventa_diagnostics/status-after-demo-qa-*.txt \
  .puntaventa_diagnostics/log-after-demo-qa-*.txt \
  .puntaventa_diagnostics/docker-ps-after-demo-qa-*.txt \
  .puntaventa_diagnostics/api-health-after-demo-qa-*.txt \
  .puntaventa_diagnostics/web-head-after-demo-qa-*.txt \
  .puntaventa_diagnostics/demo-usage-validation-*.json

git --no-pager status --short --untracked-files=all
```

## 8. Limpiar solo datos demo

Ejecutar con Postgres arriba y API/Web detenidos.

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

docker compose up -d postgres
docker compose stop api web

npm run api:seed:demo-usage -- --only-clean
```
