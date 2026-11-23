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
# set DATABASE_URL + JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

API: `http://localhost:4000`  
Health: `GET /health`

## Main endpoints

- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/slug/:slug`
- `POST /api/orders/checkout`
- `GET /api/orders` (admin)
- `GET /api/orders/:id/tajir-copy` (admin)
- `PATCH /api/orders/:id/status` (admin)
- `GET /api/analytics/dashboard` (admin)

Admin seed: `admin@ghazala.store` / `ChangeMeAdmin123!`
