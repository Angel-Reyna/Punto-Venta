# UI Lab visual de Punta Venta

El UI Lab permite revisar diseños ejecutables antes de tocar pantallas productivas. No reemplaza la app real ni llama al backend; usa datos mock, el mismo theme de MUI y tokens explícitos de layout.

## Objetivo

Evitar implementar diseños desde imágenes sueltas. Una imagen puede servir como inspiración, pero no define breakpoints, densidad, medidas, espaciados, estados ni reglas responsive. El UI Lab convierte esas decisiones en código revisable.

## Uso local

Con el proyecto local levantado solo para frontend:

```bash
cd "/c/Users/drago/Proyectos/Punta_Venta"
npm run web:ui-lab
```

Luego abrir:

```text
http://127.0.0.1:5176/ui-lab
```

La ruta `/ui-lab` solo está disponible en modo desarrollo (`import.meta.env.DEV`). En build productivo redirige al inicio.

## Reglas de diseño

- Usar el theme real de `apps/web/src/theme/theme.ts`.
- Definir medidas en `apps/web/src/design-lab/pvVisualTokens.ts` antes de mover UI real.
- Crear variantes por dispositivo: móvil, tablet, laptop y desktop amplio.
- Revisar estados con datos mock: stock sano, stock bajo, stock cero, vendedor sin stock asignado, ticket activo y flujo admin/vendedor.
- Priorizar impacto visual con semántica: iconos, color, chips y tarjetas deben representar datos o acciones reales. Evitar barras decorativas si el dato no es progreso, capacidad o distribución proporcional.
- Migrar a la app real solo la variante aprobada.
- Validar después con lint, build y E2E funcional.

## Pantallas iniciales

Este primer prototipo incluye:

- Inventario: página completa candidata con movimientos visuales, existencias semánticas, acciones visibles y distribución por almacén/vendedor.

## Siguientes pasos recomendados

1. Revisar el UI Lab en 390 px, 768 px, 1366 px y 1536 px.
2. Ajustar tokens hasta aprobar densidad y jerarquía visual.
3. Agregar variantes para Dashboard, Productos, Reportes, Auditoría, Actividad vendedores y Usuarios.
4. Migrar una sola pantalla real por patch.
5. Agregar screenshots visuales cuando una variante quede aprobada.
