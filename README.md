# Punto de venta App

Aplicación web completa para punto de venta, inventario, productos, reportes y auditoría.

## Stack

- Frontend: React + Vite + TypeScript + Material UI
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL
- ORM: Prisma
- Auth: JWT con roles `ADMIN` y `CASHIER`
- Excel: importación y plantilla descargable
- PDF: reportes descargables
- Docker: PostgreSQL local

## Levantar proyecto

```bash
docker compose up -d

cd apps/api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

En otra terminal:

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

## Usuario inicial

```txt
admin@pos.local
Admin12345
```

## URLs

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:4000
Health:   http://localhost:4000/health
```
