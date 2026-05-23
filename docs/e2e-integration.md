# E2E integrado con backend y PostgreSQL

Este flujo valida Punta Venta sin mocks: levanta PostgreSQL, prepara una base aislada, inicia la API real, inicia la Web real y ejecuta Playwright contra el flujo vendedor → venta → inventario.

## Ejecutar

Desde la raíz del proyecto:

```bash
npm run web:e2e:integration
```

El script usa por defecto:

```txt
PostgreSQL Docker: localhost:5432
DATABASE_URL: postgresql://postgres:postgres@127.0.0.1:5432/pos_senior_db?schema=e2e
API: http://127.0.0.1:4010
Web: http://127.0.0.1:5175
```

Credenciales sembradas para la prueba integrada:

```txt
Admin: admin.e2e@puntaventa.test / Admin12345DevOnly
Vendedor: vendedor.e2e@puntaventa.test / Vendedor12345DevOnly
Producto: E2E-COCA-600
Stock inicial: 24
```

## Qué cubre

La prueba integrada valida que:

- el login real del vendedor funciona;
- el vendedor puede entrar a Ventas;
- el producto físico sembrado aparece en búsqueda por SKU;
- la venta en efectivo se registra sin caja obligatoria;
- la venta queda visible en el historial;
- el ticket se limpia después de cobrar;
- el inventario real descuenta stock de 24 a 23.

## Aislamiento

La prueba usa el schema PostgreSQL `e2e`, no `public`. Antes de correr, ejecuta `prisma migrate reset --force --skip-seed` contra ese schema y luego corre un seed específico de E2E.

No uses este flujo contra una base de producción. Si cambias `E2E_DATABASE_URL`, asegúrate de que apunte a una base descartable.

## Variables opcionales

```bash
E2E_API_PORT=4010 \
E2E_WEB_PORT=5175 \
POSTGRES_PORT=5432 \
E2E_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/pos_senior_db?schema=e2e" \
npm run web:e2e:integration
```

## Diferencia contra `npm run web:e2e`

`npm run web:e2e` ejecuta smoke tests rápidos con API mockeada. Sirve para validar navegación, permisos visuales y UX básica.

`npm run web:e2e:integration` valida el flujo real completo y es más lento. Úsalo antes de cerrar cambios que toquen ventas, inventario, autenticación, Prisma o Docker.
