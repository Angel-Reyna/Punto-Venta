# Arquitectura backend modular

Fecha de corte: después de Patch 63.

Alcance: documentación de la estructura backend actual de Punta Venta después de los refactors por dominio.

## Objetivo

El backend debe conservar una separación clara entre transporte HTTP, validación, reglas de dominio, mapeo de respuestas, persistencia y efectos secundarios como auditoría o actividad de vendedores. La regla operativa es simple: las rutas no deben contener lógica de negocio compleja y los servicios no deben depender de detalles de presentación del frontend.

Esta documentación no cambia contratos. Describe la convención vigente para continuar el proyecto sin volver a concentrar lógica en archivos gigantes.

## Convención por módulo

La estructura recomendada por módulo es:

```txt
apps/api/src/modules/<modulo>/
  <modulo>.routes.ts      -> Express Router, middlewares, permisos, validación, respuestas HTTP.
  <modulo>.service.ts     -> casos de uso, transacciones, reglas de dominio y coordinación Prisma.
  <modulo>.shared.ts      -> schemas Zod, tipos de entrada/salida, constantes y helpers puros compartidos.
  <modulo>.mappers.ts     -> includes Prisma, tipos derivados y mapeo de entidades a DTOs.
  <modulo>.<area>.ts      -> lógica especializada cuando el módulo lo justifique.
```

No todos los módulos necesitan todos los archivos. Crear un archivo extra solo se justifica cuando reduce acoplamiento, mejora testabilidad o evita que `routes.ts`/`service.ts` crezcan sin control.

## Responsabilidades por capa

### `*.routes.ts`

Debe limitarse a:

- declarar rutas Express;
- aplicar `authenticate`, `requirePermission`, `requireRoles` u otros middlewares;
- validar `params`, `query` y `body` con Zod;
- convertir query strings a tipos de aplicación cuando sea trivial;
- llamar servicios;
- asignar headers de paginación;
- responder con códigos HTTP y JSON.

No debe contener:

- cálculos de dinero;
- decisiones de inventario;
- mutaciones Prisma complejas;
- auditoría manual repetida si el servicio ya puede recibir contexto;
- mapeos grandes de entidades;
- reglas de permisos duplicadas fuera del middleware.

### `*.service.ts`

Debe concentrar:

- casos de uso del módulo;
- transacciones Prisma;
- validaciones de reglas de negocio;
- llamadas a auditoría o actividad operativa cuando forman parte del caso de uso;
- coordinación entre módulos cuando sea necesario;
- manejo de errores de dominio con `AppError`.

Debe evitar:

- conocimiento de layout/frontend;
- lógica repetida de includes/mappers;
- parseo extenso de archivos o query strings;
- serialización HTTP directa.

### `*.shared.ts`

Debe contener elementos puros y estables:

- schemas Zod;
- tipos derivados de schemas;
- constantes del dominio;
- helpers sin efectos secundarios;
- parseadores simples de query/fechas cuando se comparten entre route y service.

No debe importar `prisma` ni ejecutar efectos de base de datos.

### `*.mappers.ts`

Debe contener:

- `include`/`select` de Prisma usados para DTOs;
- tipos derivados con `Prisma.<Model>GetPayload`;
- funciones `map...` para transformar entidades internas a respuestas públicas;
- sanitización de datos que no deben salir al frontend.

Los mappers no deben ejecutar escrituras ni abrir transacciones.

### Archivos especializados

Usar archivos especializados cuando una subárea crece lo suficiente:

- `products.import.ts` para importación Excel;
- `sales.stock.ts` para restauración de stock en cancelaciones/devoluciones;
- `reports.operations.ts` para agregados operativos;
- `auth.cookies.ts` para cookies y metadatos de cliente.

## Estado actual por módulo

### Auth

```txt
auth.routes.ts
auth.service.ts
auth.schemas.ts
auth.tokens.ts
auth.token-hash.ts
auth.csrf.ts
auth.cookies.ts
auth.shared.ts
permissions.ts
```

Responsabilidades relevantes:

- `auth.routes.ts`: login, refresh, logout, CSRF, perfil y registro de vendedores.
- `auth.service.ts`: autenticación, refresh sessions, rotación, revocación y emisión de tokens.
- `auth.cookies.ts`: lectura/escritura/limpieza de cookies y metadatos de cliente.
- `auth.shared.ts`: usuario público, normalización de email y expiración de refresh.
- `permissions.ts`: matriz de permisos derivados del rol.

Reglas críticas:

- El refresh token va en cookie `httpOnly`.
- Los refresh tokens se almacenan hasheados con pepper.
- Reset de contraseña, cambio de rol y desactivación deben revocar sesiones.
- No exponer `passwordHash`, hashes de tokens ni secretos en respuestas o auditoría.

### Audit

```txt
audit.routes.ts
audit.service.ts
audit.shared.ts
```

Responsabilidades:

- `audit.routes.ts`: endpoint protegido para lectura de eventos.
- `audit.service.ts`: escritura tolerante de eventos y listado paginado.
- `audit.shared.ts`: parseo de filtros y construcción de `AuditLogWhereInput`.

Reglas críticas:

- La escritura de auditoría no debe romper el flujo principal si falla.
- Los filtros deben permitir buscar por acción, tabla, recordId, usuario y fechas.
- No deben persistirse datos sensibles completos en `oldData`/`newData`.

### Users

```txt
users.routes.ts
users.service.ts
users.shared.ts
```

Responsabilidades:

- `users.routes.ts`: endpoints administrativos y headers de paginación.
- `users.service.ts`: crear usuario, cambiar rol, resetear contraseña y activar/desactivar.
- `users.shared.ts`: schemas Zod, `publicUserSelect` y tipos públicos.

Reglas críticas:

- Usar `publicUserSelect` para evitar filtrar `passwordHash`.
- Reset de contraseña debe cerrar sesiones existentes.
- Cambio de rol debe cerrar sesiones para recalcular permisos efectivos.
- Desactivación debe impedir login y revocar sesiones.

### Seller Activity

```txt
seller-activity.routes.ts
seller-activity.service.ts
seller-activity.shared.ts
```

Responsabilidades:

- registrar actividad operativa de vendedores;
- listar eventos con filtros;
- calcular resumen por vendedor/acción;
- validar rangos de fecha.

Reglas críticas:

- La escritura debe ser tolerante a fallos.
- Solo debe registrar actividad relevante del flujo operativo.
- Los filtros del frontend deben preservarse durante auto-refresh.

### Inventory

```txt
inventory.routes.ts
inventory.service.ts
inventory.shared.ts
inventory.mappers.ts
```

Responsabilidades:

- `inventory.routes.ts`: endpoints de consulta y movimiento.
- `inventory.service.ts`: reglas de stock, almacén por defecto, entradas/salidas.
- `inventory.shared.ts`: schema de movimiento y constantes.
- `inventory.mappers.ts`: includes y snapshots para movimientos.

Reglas críticas:

- No permitir salida que deje stock negativo.
- Registrar movimientos con snapshot `productSku`/`productName`.
- Productos eliminados físicamente deben seguir visibles en historial por snapshot.
- Operaciones de stock críticas deben ejecutarse en transacción cuando formen parte de venta, devolución o cancelación.

### Cash Register

```txt
cash-register.routes.ts
cash-register.service.ts
cash-register.shared.ts
cash-register.mappers.ts
```

Responsabilidades:

- abrir/cerrar caja;
- registrar movimientos manuales;
- registrar movimientos por venta/devolución;
- mapear cortes y movimientos.

Reglas críticas:

- La caja no debe bloquear ventas en efectivo.
- Es un módulo secundario que puede evolucionar a liquidaciones/entrega de efectivo.
- Movimientos manuales requieren permisos administrativos.

### Dashboard

```txt
dashboard.routes.ts
dashboard.service.ts
dashboard.shared.ts
dashboard.mappers.ts
```

Responsabilidades:

- resumen por rol;
- ventas recientes;
- bajo stock;
- caja abierta;
- métricas administrativas.

Reglas críticas:

- El dashboard no debe recalcular reglas críticas que viven en ventas/inventario.
- Para vendedores, limitar la información a su alcance operativo.

### Reports

```txt
reports.routes.ts
reports.service.ts
reports.shared.ts
reports.operations.ts
```

Responsabilidades:

- reportes de ventas;
- reporte operativo;
- agregados por vendedor, estado, pago, caja y productos;
- top productos con snapshot histórico.

Reglas críticas:

- Productos eliminados físicamente deben seguir apareciendo en reportes históricos.
- Usar snapshots `productSku`/`productName` cuando `productId` sea `null`.
- Rango de fechas debe validarse antes de consultar.

### Products

```txt
products.routes.ts
products.service.ts
products.import.ts
```

Responsabilidades:

- catálogo;
- creación/actualización de productos;
- activación/desactivación;
- eliminación física preservando historial;
- importación Excel y plantilla.

Reglas críticas:

- `sku` debe ser único.
- `barcode` no puede pertenecer a otro SKU.
- Importación Excel debe validar duplicados antes de confirmar transacción.
- La eliminación física solo es segura porque ventas, devoluciones e inventario guardan snapshots.

### Sales

```txt
sales.routes.ts
sales.service.ts
sales.shared.ts, si se agrega en una fase posterior
sales.mappers.ts
sales.stock.ts
```

Responsabilidades:

- crear venta;
- validar pago suficiente;
- cancelar venta;
- registrar devolución;
- mapear venta con snapshots históricos;
- restaurar stock solo para productos todavía existentes.

Reglas críticas:

- Venta en efectivo no requiere caja abierta.
- Pago recibido no puede ser menor al total.
- Creación/cancelación/devolución deben ser transaccionales.
- Si `productId` es `null`, no intentar restaurar stock; conservar historial por snapshot.

## Reglas transversales

### Transacciones

Usar transacciones cuando una operación modifique dos o más agregados relacionados, especialmente:

- venta + inventario + pagos + actividad;
- cancelación + devolución + inventario + auditoría;
- importación masiva + stock inicial;
- cierre de caja + movimientos;
- cambios de usuario + revocación de sesiones.

Preferir aislar lógica transaccional en servicios. Las rutas no deben abrir transacciones.

### Auditoría

Auditar operaciones críticas:

- creación, actualización, desactivación y eliminación de productos;
- ventas, cancelaciones y devoluciones;
- cambios de rol;
- reset de contraseña;
- activación/desactivación de usuarios;
- movimientos manuales de caja;
- importaciones.

Antes de guardar snapshots de auditoría, revisar que no incluyan secretos, hashes, tokens, cookies o contraseñas.

### Validación

Toda entrada externa debe pasar por Zod o validación equivalente antes de llegar al servicio:

- `body`;
- `params`;
- `query`;
- archivos importados;
- rangos de fecha;
- cantidades y dinero.

El frontend puede validar para UX, pero el backend es la fuente de verdad.

### Permisos

Toda ruta mutante o sensible debe declarar permiso explícito. No confiar solo en ocultar botones en el frontend.

Cuando se agregue un endpoint:

1. definir permiso efectivo;
2. agregarlo a la matriz de permisos;
3. proteger ruta backend;
4. ocultar/deshabilitar acción frontend;
5. agregar prueba de permisos si es crítico.

### Snapshots históricos

Cuando una entidad pueda eliminarse físicamente pero sea referenciada por historial, guardar snapshot de los campos necesarios para reportes y auditoría.

Regla actual para productos:

```txt
SaleItem.productSku
SaleItem.productName
SaleReturnItem.productSku
SaleReturnItem.productName
InventoryMovement.productSku
InventoryMovement.productName
```

Si se elimina `Product`, las relaciones históricas pueden quedar con `productId = null`, pero las pantallas y reportes deben seguir usando snapshots.

## Checklist para nuevos refactors backend

Antes de entregar un patch de refactor:

```bash
git status --short
git diff --name-status
git diff --check
git apply --check --whitespace=error PATCH.patch
```

Además verificar:

- archivos nuevos incluidos en el patch;
- imports relativos correctos;
- no duplicar tipos o helpers con nombres divergentes;
- no mover schemas usados por rutas sin exportarlos;
- no cambiar contratos HTTP accidentalmente;
- no alterar permisos;
- no alterar transacciones;
- no exponer campos sensibles.

Validación mínima después de aplicar:

```bash
npm run api:build
npm run api:test:critical
```

Validación recomendada si el cambio puede afectar frontend o flujos reales:

```bash
npm run web:e2e
npm run web:build
npm run web:test
npm run web:e2e:integration
```

## Criterio para seguir refactorizando

No dividir archivos por estética. Dividir cuando exista una razón concreta:

- el archivo mezcla transporte, dominio y mapeo;
- hay lógica reutilizable en tests o rutas;
- el servicio supera un tamaño que dificulta revisión;
- hay riesgo de filtrar datos sensibles;
- hay reglas críticas que necesitan tests aislados;
- hay parsing de archivos o queries que distrae del caso de uso.

Si un refactor exige cambiar comportamiento, debe separarse en otro patch funcional con pruebas específicas.
