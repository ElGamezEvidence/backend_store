# backend_store

API e-commerce COD Maroc (Ghazala Store) — PostgreSQL / Prisma / workflow manuel Tajir COD.

## Stack

- Node.js + Express + TypeScript
- Prisma + PostgreSQL (Neon)
- JWT auth (admin)
- Zod validation
- Rate limiting on checkout

## Setup

```bash
cp .env.example .env
# set DATABASE_URL (Neon) + JWT_SECRET + CORS_ORIGIN (frontend URL)
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

API: `http://localhost:4000`  
Health: `GET /health`

## Environment (déploiement séparé)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL |
| `JWT_SECRET` | Secret JWT admin |
| `PORT` | Port API (ex: 4000) |
| `CORS_ORIGIN` | URL du frontend (ex: `https://frontend.vercel.app`) |

Le frontend doit pointer `NEXT_PUBLIC_API_URL` / `API_URL` vers cette API.

## Main endpoints

- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/slug/:slug`
- `POST /api/orders/checkout`
- `GET /api/orders` (admin)
- `GET /api/orders/export/excel` (admin) — export Tajir template
- `GET /api/orders/:id/tajir-copy` (admin)
- `PATCH /api/orders/:id/status` (admin)
- `GET /api/analytics/dashboard` (admin)

### Export Excel (template Tajir)

Colonnes: `full_name`, `phone`, `address`, `note`, `delivery_note`, `price`, `sku`, `qte`, `date_order`  
Une ligne par article (SKU / quantité).

Admin seed: `admin@ghazala.store` / `ChangeMeAdmin123!`
