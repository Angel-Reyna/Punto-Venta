# Pruebas E2E con Playwright

Este proyecto incluye una base de pruebas E2E para validar navegación, permisos visuales y pantallas operativas críticas del frontend.

Las pruebas actuales usan mocks HTTP de la API. Esto permite cubrir rutas, permisos, responsividad y contratos mínimos sin depender de una base de datos real en cada ejecución.

## Comandos

Desde la raíz del repositorio:

```bash
npm run web:e2e
```

Instalar navegadores localmente:

```bash
npm --prefix apps/web run playwright:install
```

Modo interactivo:

```bash
npm --prefix apps/web run e2e:ui
```

## Alcance actual

Las pruebas cubren:

- login de admin;
- navegación administrativa;
- bloqueo visual y por ruta directa para vendedor;
- navegación móvil operativa;
- carga de Productos con búsqueda por SKU;
- carga de Inventario con existencias visibles.

## Criterio de diseño

Los mocks no sustituyen las pruebas backend. El backend sigue validándose con Jest y Prisma. Playwright aquí valida la experiencia real del navegador: rutas, permisos del cliente, responsive y renderizado de flujos principales.

## Próximos flujos recomendados

Cuando el modelo de datos quede estable, conviene agregar E2E con backend real para:

- crear producto con stock inicial;
- registrar venta como vendedor;
- cancelar/devolver venta como admin;
- importar Excel;
- generar reporte PDF;
- validar que rutas directas admin siguen bloqueadas para vendedor.
