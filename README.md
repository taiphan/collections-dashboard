<h1 align="center">🏢 Enterprise Platform</h1>

<p align="center">
  <strong>A suite of enterprise applications for financial services, logistics, and data analytics.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-green" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-20-339933" alt="Node.js" />
</p>

---

## Applications

| App | Description | Frontend | Backend |
|-----|-------------|----------|---------|
| [Collections Dashboard](./collections-dashboard/) | Debt collections management with analytics | :3010 | — |
| [LOS System](./los-system/) | Loan origination with decision engine | :3011 | :4000 |
| [Warehouse Management](./warehouse-management/) | Inventory and order fulfillment | :3012 | :4001 |
| [Data Viz](./data-viz/) | Self-service analytics platform | :3013 | :4002 |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (for LOS and WMS)
- Redis 7+ (for LOS and WMS)

### Run All Services

```bash
# Collections Dashboard (port 3010)
cd collections-dashboard && npm install && npm run dev -- -p 3010

# LOS System (ports 3011 + 4000)
cd los-system/backend && npm install && npm run dev
cd los-system/frontend && npm install && npx vite --port 3011

# Warehouse Management (ports 3012 + 4001)
cd warehouse-management/backend && npm install && npm run dev
cd warehouse-management/frontend && npm install && npx vite --port 3012 --host

# Data Viz (ports 3013 + 4002)
cd data-viz && npm install && npm run dev -- -p 3013
cd data-viz/proxy && npm install && npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTENDS                             │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Collections  │  LOS System  │  Warehouse   │   Data Viz     │
│  (Next.js)   │   (Vite)     │   (Vite)     │  (Next.js)     │
│   :3010      │    :3011     │    :3012     │    :3013       │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬────────┘
       │              │              │               │
       │       ┌──────┴──────┐ ┌────┴─────┐  ┌─────┴──────┐
       │       │ LOS Backend │ │WMS Backend│  │ Viz Proxy  │
       │       │   :4000     │ │   :4001   │  │   :4002    │
       │       └──────┬──────┘ └────┬──────┘  └─────┬──────┘
       │              │             │                │
       │       ┌──────┴─────────────┴────────────────┘
       │       │
  ┌────┴───────┴────┐     ┌──────────┐
  │   PostgreSQL    │     │  Redis   │
  │     :5432       │     │  :6379   │
  └─────────────────┘     └──────────┘
```

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Frontend Frameworks | Next.js 16, Vite + React 18 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3/4 |
| UI Libraries | shadcn/ui, Radix UI, Base UI |
| State Management | Zustand, TanStack Query |
| Backend | Express.js, Node.js 20 |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis + BullMQ |
| Auth | JWT + bcrypt (12 rounds) |
| Charts | Recharts, D3 |
| Testing | Vitest |

## Design Standards

All applications follow a consistent design language:

- **Favicons** — Dark slate rounded-rect (`#0f172a`) with app-specific colored icons
- **Typography** — System font stack (Geist for Next.js apps)
- **Color System** — oklch color space with semantic tokens
- **Components** — Accessible primitives with ARIA labels
- **Responsive** — Mobile-first with breakpoint-based layouts

## Project Structure

```
project/
├── collections-dashboard/    # Next.js 16 — Debt collections
├── los-system/
│   ├── backend/              # Express.js — Loan origination API
│   └── frontend/             # Vite + React — LOS UI
├── warehouse-management/
│   ├── backend/              # Express.js — WMS API
│   └── frontend/             # Vite + React — WMS UI
├── data-viz/
│   ├── src/                  # Next.js 16 — Analytics platform
│   └── proxy/                # Express.js — DB connector proxy
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Author

**taiphan** — [github.com/taiphan](https://github.com/taiphan)
