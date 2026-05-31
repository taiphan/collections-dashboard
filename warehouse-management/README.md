<p align="center">
  <img src="logo.svg" alt="WMS" width="120" height="120" />
</p>

<h1 align="center">WMS — Warehouse Management System</h1>

<p align="center">
  <strong>Full-featured warehouse management platform with inventory tracking, order fulfillment, and zone-based operations.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-green" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/React-18-61dafb" alt="React" />
  <img src="https://img.shields.io/badge/Express-4-000000" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791" alt="PostgreSQL" />
</p>

---

## Overview

WMS is a comprehensive warehouse management system designed for modern logistics operations. It handles the full warehouse lifecycle — receiving, putaway, inventory management, picking, packing, and shipping — with real-time visibility and analytics.

## Features

### Backend
- **Inventory Management** — Real-time stock levels with location tracking
- **Order Processing** — End-to-end fulfillment workflow
- **Zone Management** — Configurable warehouse zones and bin locations
- **Operations** — Receiving, putaway, picking, packing, shipping
- **Background Jobs** — BullMQ for async processing (stock alerts, reports)
- **Redis Caching** — Fast inventory lookups and session management
- **Audit Trail** — Complete history of inventory movements

### Frontend
- **Dashboard** — Key metrics (fill rate, order velocity, aging inventory)
- **Inventory Browser** — Search, filter, and drill-down by location
- **Order Management** — Order lifecycle with status tracking
- **Catalog** — Product master data management
- **Analytics** — Charts for throughput, accuracy, and utilization
- **Import/Export** — Bulk data operations with validation
- **Reports** — Configurable operational reports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Express.js + Node.js 20 |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| Auth | JWT + bcrypt |
| UI | Radix UI + Tailwind CSS 3 |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Backend
cd warehouse-management/backend
npm install
cp .env.example .env  # Configure database URL, Redis, JWT secret
npx prisma migrate dev
npx prisma db seed

# Frontend
cd ../frontend
npm install
```

### Development

```bash
# Terminal 1 — Backend (port 4001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3012)
cd frontend
npx vite --port 3012 --host
```

### Build

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Project Structure

```
warehouse-management/
├── backend/
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation, logging
│   │   └── server.ts       # Express app entry
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.ts         # Seed data
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route pages
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript interfaces
│   └── index.html
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/inventory` | List inventory items |
| GET | `/api/inventory/:sku` | Get item by SKU |
| POST | `/api/inventory/receive` | Receive stock |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders |
| PUT | `/api/orders/:id/pick` | Start picking |
| PUT | `/api/orders/:id/ship` | Mark shipped |
| GET | `/api/analytics/dashboard` | Dashboard metrics |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
