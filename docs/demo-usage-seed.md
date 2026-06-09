# Seed demo de uso realista

Este seed inserta datos de demostración para simular uso real de Punta Venta durante los últimos días. Está pensado para desarrollo, QA visual y revisión de reportes, gráficas, auditoría, inventario y ventas.

No reemplaza el seed base de la aplicación. Genera datos con prefijo `DEMO` y correos bajo `demo.puntaventa.local` para poder limpiarlos sin tocar datos manuales.

## Qué genera

- Admin demo y tres vendedores demo.
- Productos demo de abarrotes.
- Almacenes demo normales y almacenes de stock físico por vendedor.
- Entradas de inventario, transferencias aprobadas, solicitudes pendientes/rechazadas de retiro.
- Ventas distribuidas entre este mes y el mes pasado.
- Tickets con varios productos, descuentos ocasionales y distintos métodos de pago.
- Devoluciones, cancelaciones solicitadas y ajustes pendientes/rechazados.
- Mermas por caducidad para alimentar reportes de utilidad operativa y Pareto de merma.
- Actividad de vendedores y auditoría operativa.

## Uso recomendado

Con Postgres levantado y API/Web detenidos:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

docker compose up -d postgres
docker compose stop api web

npm run api:seed:demo-usage -- --days=60 --reset-demo --seed=punta-demo-60
```

El comando raíz reenvía argumentos al script de API. Si ejecutas el script directo desde el paquete API, usa `npm --prefix apps/api run seed:demo-usage -- --days=60 --reset-demo`.

Después levanta la app sin recrear la base:

```bash
docker compose up -d --build api web
```

Credenciales demo generadas:

```text
Admin:    demo.admin@demo.puntaventa.local
Vendedor: demo.vendedor.norte@demo.puntaventa.local
Vendedor: demo.vendedor.centro@demo.puntaventa.local
Vendedor: demo.vendedor.ruta@demo.puntaventa.local
Password: Demo12345DevOnly
```

## Limpiar solo datos demo

```bash
npm run api:seed:demo-usage -- --only-clean
```

`--only-clean` elimina solo registros con prefijo/correos demo. No usa `docker compose down -v` y no borra la base completa.

## Opciones

```text
--days=60          Rango hacia atrás. Mínimo 7, máximo 180.
--seed=texto       Hace la simulación reproducible.
--reset-demo       Limpia datos demo previos antes de insertar nuevos.
--only-clean       Solo limpia datos demo y termina.
--force-production Permite correr en NODE_ENV=production únicamente bajo responsabilidad explícita.
```

## Notas de seguridad

No uses este seed en una base productiva real. Está bloqueado por defecto cuando `NODE_ENV=production`.
