# CI quality gates

Este repositorio valida tres capas antes de aceptar cambios en `main`:

1. **Guardrails del repositorio**
   - Verifica que `apps/api/package-lock.json` y `apps/web/package-lock.json` existan.
   - Verifica que los lockfiles coincidan con sus `package.json`.
   - Bloquea dependencias locales accidentales como `file:../..`, porque rompen builds Docker con contexto por app.
   - Valida que `docker compose config` sea resoluble.

2. **Backend/API**
   - Instala con `npm ci`.
   - Valida Prisma.
   - Genera Prisma Client.
   - Aplica migraciones contra PostgreSQL de CI.
   - Ejecuta pruebas críticas.
   - Ejecuta la suite completa.
   - Compila TypeScript.

3. **Frontend/Web**
   - Instala con `npm ci`.
   - Ejecuta pruebas críticas de permisos y navegación.
   - Compila TypeScript y Vite.

4. **Docker**
   - Construye imágenes de `api` y `web` después de que API/Web pasen.

## Validación local equivalente

Antes de hacer push, ejecuta:

```bash
npm run ci:validate-lockfiles
npm run api:prisma:generate
npm run api:build
npm run api:test:critical
npm run web:test:critical
npm run web:build
docker compose build api web
```

Si cambias dependencias, actualiza y commitea el lockfile del paquete afectado:

```bash
npm --prefix apps/api install
npm --prefix apps/web install
```

No uses `npm install` dentro de Dockerfiles. Los contenedores deben usar `npm ci` para builds reproducibles.
