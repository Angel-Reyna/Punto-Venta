# QA crítica de Punta Venta

Este documento define la matriz mínima de verificación funcional para evitar regresiones en los flujos POS principales. Debe ejecutarse después de cambios en autenticación, permisos, productos, inventario, caja, ventas, reportes o navegación.

## Preparación local

```bash
npm run dev:bootstrap
npm run build
npm run test
npm run qa:critical
```

Variables esperadas en desarrollo local:

- `DATABASE_URL` debe apuntar a `localhost`, no a `postgres`.
- `CORS_ORIGIN=http://localhost:5173`.
- `VITE_API_URL=http://localhost:4000/api`.
- `COOKIE_SECURE=false` en HTTP local.
- `COOKIE_SAME_SITE=lax` en HTTP local.
- El usuario seed ADMIN debe estar activo y su contraseña debe coincidir con `SEED_ADMIN_PASSWORD` o con el valor documentado de desarrollo.

## Matriz ADMIN

| Flujo | Resultado esperado |
| --- | --- |
| Login admin | Entra al dashboard y recibe permisos administrativos efectivos desde backend. |
| Crear producto con stock inicial | Crea producto, `InventoryBalance` y movimiento `IN`; aparece en ventas sin reiniciar. |
| Descargar formato Excel | Descarga `.xlsx` con columnas actuales, incluida categoría y stock inicial. |
| Importar Excel | Crea productos válidos con inventario real; rechaza filas inválidas con mensaje accionable. |
| Activar/desactivar producto | Cambia estado; producto inactivo no aparece para cajero. |
| Abrir caja | Crea sesión abierta y actualiza dashboard/ventas. |
| Registrar movimiento manual | Solo admin; actualiza efectivo esperado. |
| Crear venta | Valida stock, descuenta inventario y registra pago/movimiento de caja si es efectivo. |
| Cancelar venta | Solo admin; revierte inventario y registra salida/devolución cuando aplique. |
| Registrar devolución | Solo admin; respeta cantidades máximas, inventario y caja. |
| Consultar reporte | Muestra venta bruta, devoluciones, venta neta, pagos, caja y productos vendidos netos. |
| Descargar PDF | Exporta el mismo criterio operativo visible en pantalla. |
| Crear usuario | Crea usuario activo con rol correcto. |
| Cambiar rol | Revoca refresh sessions activas del usuario afectado. |
| Resetear contraseña | Revoca sesiones activas del usuario afectado. |
| Activar/desactivar usuario | Usuario inactivo queda bloqueado aunque tenga access token vigente. |

## Matriz CASHIER

| Flujo | Resultado esperado |
| --- | --- |
| Login cajero | Entra con permisos operativos, sin permisos admin. |
| Ver productos | Ve productos activos, stock y precio; no ve costo ni margen. |
| Ver inventario | Ve inventario sin botones de ajuste. |
| Abrir/cerrar su caja | Puede operar su propia caja. |
| Crear venta con caja abierta | Puede cobrar; efectivo exige caja abierta. |
| Crear venta sin caja abierta | Efectivo queda bloqueado en frontend y backend. |
| Rutas admin directas | Devuelven `403 No autorizado` y registran intento fallido auditable. |
| Botones admin | No aparecen importación, toggle producto, reportes, usuarios, auditoría, movimientos manuales, cancelación ni devolución. |

## Pruebas automatizadas cubiertas por `qa:critical`

- Permisos efectivos frontend normalizados desde el servidor.
- Menú y CTA principal según permisos reales.
- Rutas directas admin bloqueadas para CASHIER.
- CASHIER puede leer productos sin campos administrativos.
- CASHIER puede operar su caja.
- CASHIER puede crear ventas válidas por ruta autorizada.
- ADMIN puede alcanzar reportes protegidos por `ReportsRead`.

## Verificaciones manuales pendientes

Estas pruebas siguen siendo manuales hasta introducir Playwright/Cypress con navegador real:

1. Atajos de teclado en venta: Enter/F12 no deben disparar acciones con modal abierto, ticket vacío, submit en curso o caja cerrada.
2. Responsive visual en dashboard, productos y ventas.
3. Descarga real de Excel/PDF desde navegador.
4. Importación real con archivo Excel del usuario.
5. Confirmaciones visuales y foco accesible después de errores.
