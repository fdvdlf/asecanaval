# ASOMAR ERP Monorepo

Monorepo con:
- apps/web: React + Vite + Tailwind (UI con mocks)
- apps/api: NestJS + Prisma + Postgres

## Requisitos
- Node.js 20+
- Docker (para Postgres via compose)

## Instalacion
```bash
npm install
```

## Web
```bash
npm run dev:web
```
- URL: http://localhost:5174
- Configuracion: `apps/web/.env` (VITE_API_URL, VITE_WEB_PORT)

## API (local)
1) Levanta Postgres
```bash
docker compose up -d db
```

2) Configura variables (usa `apps/api/.env.example` como plantilla):
- `DATABASE_URL=postgresql://asomar_user:change-me@localhost:5434/asomar?schema=public`
- `PORT=3100`

3) Genera Prisma Client y aplica el schema
```bash
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:push
```

4) Inicia la API
```bash
npm run dev:api
```

- Healthcheck: http://localhost:3100/health
- Swagger: http://localhost:3100/docs

## API con Docker Compose
```bash
docker compose up --build
```

- Healthcheck: http://localhost:3100/health
- Swagger: http://localhost:3100/docs
- El servicio `db-init` crea el rol `asomar_user` y la base `asomar` si no existen.

## Notas
- El frontend usa mocks; no hay conexion con la API aun.
