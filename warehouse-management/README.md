# Warehouse Management System (WMS)

A comprehensive warehouse management system for tracking catalog items, product SKUs/barcodes, import/export workflows with approval, inventory management, reporting, and predictive analytics.

## Tech Stack

- **Backend**: Express.js + TypeScript + Prisma ORM + PostgreSQL 16
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Cache**: Redis 7 (ioredis)
- **Queue**: BullMQ
- **Auth**: JWT + bcrypt (12 rounds)

## Quick Start

### Prerequisites

- Node.js 20 LTS
- Docker & Docker Compose

### 1. Start Infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:4001`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3001`

### Default Credentials

- **Admin**: admin@wms.local / admin123456
- **Manager**: manager@wms.local / admin123456
- **Staff**: staff@wms.local / admin123456

## API Endpoints

Base URL: `http://localhost:4001/api/v1`

| Module | Endpoints |
|--------|-----------|
| Auth | POST `/auth/login`, POST `/auth/refresh` |
| Catalog | CRUD `/catalog-items` |
| SKU | CRUD `/catalog-items/:id/skus`, `/skus/:id/barcodes` |
| Barcode | GET `/barcodes/lookup/:value` |
| Operations | CRUD `/operations`, `/operations/:id/submit\|approve\|reject\|cancel` |
| Inventory | GET `/inventory`, PUT `/inventory/:skuId/threshold` |
| Audit | GET `/audit-logs` |

## Project Structure

```
warehouse-management/
├── backend/          # Express.js API
│   ├── prisma/       # Database schema & migrations
│   └── src/
│       ├── app/      # Controllers, middleware, routes
│       ├── domain/   # Business logic services
│       ├── infrastructure/  # DB, cache, queue
│       └── shared/   # Config, errors, utils
├── frontend/         # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── stores/
│       └── lib/
└── docker-compose.yml
```
