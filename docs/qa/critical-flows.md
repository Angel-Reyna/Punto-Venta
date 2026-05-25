# QA crítica de Punta Venta

Este documento define la matriz mínima de verificación funcional para evitar regresiones en los flujos principales de venta por vendedor. Debe ejecutarse después de cambios en autenticación, permisos, productos, inventario, ventas, reportes o navegación.

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
| Activar/desactivar producto | Cambia estado; producto inactivo no aparece para vendedor. |
| Eliminar producto con historial | El producto desaparece de catálogo/nueva venta, pero ventas, devoluciones, inventario y reportes conservan SKU/nombre snapshot. |
| Crear venta | Valida stock, descuenta inventario y registra pago sin exigir caja abierta. |
| Cancelar venta | Solo admin; revierte inventario si el producto todavía existe; si fue eliminado físicamente, conserva snapshots sin recrear stock. |
| Registrar devolución | Solo admin; respeta cantidades máximas, restaura inventario si el producto existe y conserva snapshots si fue eliminado. |
| Consultar reporte | Muestra venta bruta, devoluciones, venta neta, pagos y productos vendidos netos. |
| Descargar PDF | Exporta el mismo criterio operativo visible en pantalla. |
| Crear usuario | Crea usuario activo con rol correcto. |
| Cambiar rol | Revoca refresh sessions activas del usuario afectado. |
| Resetear contraseña | Revoca sesiones activas del usuario afectado. |
| Activar/desactivar usuario | Usuario inactivo queda bloqueado aunque tenga access token vigente. |

## Matriz VENDEDOR

| Flujo | Resultado esperado |
| --- | --- |
| Login vendedor | Entra con permisos operativos, sin permisos admin. |
| Ver productos | Ve productos activos, stock y precio; no ve costo ni margen. |
| Ver inventario | Ve inventario sin botones de ajuste. |
| Crear venta en efectivo | Puede registrar la venta sin abrir caja. |
| Crear venta con otros métodos de pago | Puede reportar tarjeta, transferencia o método mixto. |
| Rutas admin directas | Devuelven `403 No autorizado` y registran intento fallido auditable. |
| Botones admin | No aparecen importación, toggle producto, reportes, usuarios, auditoría, movimientos manuales de caja, cancelación ni devolución. |

## Pruebas automatizadas cubiertas por `qa:critical`

- Permisos efectivos frontend normalizados desde el servidor.
- Menú y CTA principal según permisos reales.
- Rutas directas admin bloqueadas para vendedores.
- Vendedor puede leer productos sin campos administrativos.
- Vendedor no puede acceder a caja por ruta directa.
- Vendedor puede crear ventas válidas por ruta autorizada.
- ADMIN puede alcanzar reportes protegidos por `ReportsRead`.
- Eliminación física de productos preserva historial en reportes integrados.
- Cancelaciones/devoluciones de ventas con productos eliminados no recrean inventario y conservan snapshots.

## Verificaciones manuales pendientes

Aunque ya existe Playwright mockeado e integrado, estas verificaciones siguen requiriendo revisión manual o nuevos casos automatizados específicos:

1. Atajos de teclado en venta: Enter/F12 no deben disparar acciones con modal abierto, ticket vacío o submit en curso.
2. Responsive visual fino en dashboard, productos, ventas, inventario y reportes en celular/tablet/desktop.
3. Descarga real de Excel/PDF desde navegador y apertura del archivo generado.
4. Importación real con archivos Excel de usuario, incluyendo encabezados inválidos y filas mixtas.
5. Confirmaciones visuales, foco accesible y mensajes accionables después de errores.
6. Flujo futuro de liquidaciones/entregas de efectivo si se formaliza el control de dinero físico por vendedor.
