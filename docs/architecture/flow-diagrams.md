# Diagramas de flujo y modelo de datos

Este documento resume el comportamiento esperado de Punta Venta. Debe usarse como referencia para nuevas pruebas, refactors y validaciones manuales.

## Flujo funcional principal

```mermaid
flowchart TD
  A[Usuario abre Punta Venta] --> B{¿Tiene sesión activa?}
  B -- No --> C[Login]
  C --> D{Credenciales válidas y usuario activo}
  D -- No --> C
  D -- Sí --> E[Inicio]
  B -- Sí --> E

  E --> F{Rol y permisos efectivos}
  F -- Admin --> G[Gestión administrativa]
  F -- Vendedor --> H[Operación de vendedor]

  G --> G1[Productos]
  G --> G2[Inventario]
  G --> G3[Ventas]
  G --> G4[Reportes]
  G --> G5[Usuarios]
  G --> G6[Auditoría]
  G --> G7[Actividad de vendedores]
  G --> G8[Caja secundaria]

  H --> H1[Consultar productos activos]
  H --> H2[Consultar inventario]
  H --> H3[Registrar venta]
  H --> H4[Ver solo sus ventas]

  H3 --> I[API crea venta]
  I --> J[Transacción PostgreSQL]
  J --> J1[Valida producto activo]
  J --> J2[Valida stock suficiente]
  J --> J3[Crea venta, items y pagos]
  J --> J4[Descuenta inventario]
  J --> J5[Registra auditoría y actividad]
  J --> K[Venta visible en historial y reportes]
```

## Mapa de módulos por rol

```mermaid
flowchart LR
  ADMIN[Admin] --> Dashboard[Inicio]
  ADMIN --> Products[Productos]
  ADMIN --> Inventory[Inventario]
  ADMIN --> Sales[Ventas]
  ADMIN --> Reports[Reportes]
  ADMIN --> Users[Usuarios]
  ADMIN --> Audit[Auditoría]
  ADMIN --> SellerActivity[Actividad vendedores]
  ADMIN --> Cash[Caja]

  SELLER[Vendedor / CASHIER técnico] --> DashboardSeller[Inicio operativo]
  SELLER --> ProductsRead[Productos solo lectura]
  SELLER --> InventoryRead[Inventario solo lectura]
  SELLER --> SalesCreate[Crear venta]
  SELLER --> OwnSales[Historial propio]

  SELLER -.bloqueado.-> Reports
  SELLER -.bloqueado.-> Users
  SELLER -.bloqueado.-> Audit
  SELLER -.bloqueado.-> SellerActivity
```

## Flujo de venta real

```mermaid
sequenceDiagram
  actor Seller as Vendedor
  participant Web as Web React
  participant API as API Express
  participant DB as PostgreSQL
  participant Audit as Auditoría/Actividad

  Seller->>Web: Busca producto por SKU/código/nombre
  Web->>API: GET /products?q=...
  API->>DB: Consulta productos activos + stock
  DB-->>API: Productos disponibles
  API-->>Web: Catálogo visible

  Seller->>Web: Agrega producto y confirma venta
  Web->>API: POST /sales
  API->>DB: Inicia transacción
  API->>DB: Valida usuario, producto activo y stock
  API->>DB: Crea Sale, SaleItem y Payment
  API->>DB: Registra InventoryMovement SALE
  API->>DB: Actualiza InventoryBalance
  API->>Audit: Registra SALE_CREATED y audit log
  DB-->>API: Commit
  API-->>Web: Venta completada con folio
  Web-->>Seller: Ticket / historial actualizado
```

## Flujo de inventario

```mermaid
flowchart TD
  A[Admin entra a Inventario] --> B[Consulta existencias]
  B --> C{¿Registra movimiento?}
  C -- Entrada --> D[Valida producto, almacén, cantidad y motivo]
  C -- Salida --> D
  D --> E[Transacción]
  E --> F[InventoryMovement]
  E --> G[InventoryBalance]
  G --> H[Stock actualizado]
  H --> I[Producto puede aparecer como bajo inventario]
```

## Flujo de producto

```mermaid
flowchart TD
  A[Admin entra a Productos] --> B{Acción}
  B --> C[Crear producto]
  B --> D[Importar Excel]
  B --> E[Activar/desactivar]
  B --> F[Eliminar producto]
  B --> G[Descargar formato]

  C --> H[Validar SKU, precios, promoción y stock]
  D --> H
  H --> I[Crear producto]
  I --> J{¿Stock inicial > 0?}
  J -- Sí --> K[Crear movimiento IN y balance]
  J -- No --> L[Producto sin stock]
  K --> M[Catálogo actualizado]
  L --> M

  E --> N[Soft toggle isActive]
  F --> O{¿Tiene ventas/devoluciones/movimientos?}
  O -- Sí --> P[No borrar físicamente; desactivar]
  O -- No --> Q[Eliminar producto y balances vacíos]
```

## Modelo entidad-relación principal

```mermaid
erDiagram
  User ||--o{ RefreshSession : owns
  User ||--o{ Sale : creates
  User ||--o{ SaleReturn : registers
  User ||--o{ CashRegisterSession : owns
  User ||--o{ CashMovement : creates
  User ||--o{ AuditLog : produces
  User ||--o{ SellerActivityLog : produces

  ProductCategory ||--o{ Product : groups
  Product ||--o{ SaleItem : sold_as
  Product ||--o{ SaleReturnItem : returned_as
  Product ||--o{ InventoryMovement : moves
  Product ||--o{ InventoryBalance : has_stock

  Warehouse ||--o{ InventoryMovement : receives
  Warehouse ||--o{ InventoryBalance : stores

  Customer ||--o{ Sale : buys
  Sale ||--o{ SaleItem : contains
  Sale ||--o{ Payment : paid_by
  Sale ||--o{ SaleReturn : has
  Sale ||--o{ CashMovement : may_generate

  SaleReturn ||--o{ SaleReturnItem : contains
  SaleItem ||--o{ SaleReturnItem : references

  CashRegisterSession ||--o{ CashMovement : contains
```

## Reglas de integridad relevantes

- Una venta no depende de una caja abierta.
- El vendedor solo puede ver sus ventas; el admin puede ver operación completa.
- La venta debe descontar inventario real en una transacción.
- Las devoluciones deben reponer inventario y actualizar el estado de venta.
- La eliminación física de productos solo debe permitirse si el producto no tiene historial transaccional.
- Si el producto tiene ventas, devoluciones o movimientos, se debe desactivar en lugar de borrar para conservar trazabilidad.
- Los reportes deben derivarse de ventas, pagos, devoluciones, inventario y usuarios persistidos, no de cálculos aislados del frontend.

## Matriz mínima de pruebas funcionales

| Módulo | Acciones mínimas a cubrir |
| --- | --- |
| Login | login correcto, credenciales inválidas, logout, refresh. |
| Inicio | métricas por rol, navegación desktop y móvil. |
| Productos | crear, buscar, importar, descargar formato, activar/desactivar, eliminar/desactivar seguro. |
| Inventario | consultar stock, entrada, salida, validación de cantidad inválida. |
| Ventas | buscar producto, agregar/quitar, crear venta, cancelar, devolver, bloqueo sin stock. |
| Reportes | filtrar por fecha, búsqueda interna, ventas por vendedor, productos, estados, PDF. |
| Usuarios | crear, cambiar rol, reset contraseña, activar/desactivar, bloqueo vendedor. |
| Actividad vendedores | filtros por vendedor, acción, fecha y búsqueda. |
| Auditoría | filtros por usuario, acción, tabla, registro y fechas. |
| Caja | abrir, cerrar, movimiento manual, bloqueo por permisos. |
```
