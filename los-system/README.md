# LOS — Loan Origination System

Enterprise-grade Loan Origination System inspired by Pega Constellation 8.24.1.3.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                    │
│  Dashboard │ Cases │ Applications │ Customers │ Workflow UI  │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API
┌──────────────────────────────┴──────────────────────────────┐
│                   Backend (Express + Node.js)                 │
├─────────────┬──────────────┬──────────────┬─────────────────┤
│   Routes    │  Middleware  │ Controllers  │   Validators    │
├─────────────┴──────────────┴──────────────┴─────────────────┤
│                      Domain Layer                            │
│  Case Management │ Application │ Decision Engine │ Customer  │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                        │
│  PostgreSQL (Prisma) │ Redis (Cache) │ BullMQ (Queue)       │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Setup

```bash
# 1. Start infrastructure
docker compose up -d postgres redis

# 2. Backend setup
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@los.com | password123 |
| Manager | manager@los.com | password123 |
| Loan Officer | officer@los.com | password123 |
| Underwriter | underwriter@los.com | password123 |

## Loan Processing Flow

```
Application → Case Created → INTAKE → VERIFICATION → UNDERWRITING → APPROVAL → DOCUMENTATION → DISBURSEMENT → CLOSED
```

Each stage has:
- Configurable tasks (manual + automated)
- SLA tracking with escalation
- Stage-gate validation (all tasks must complete before transition)
- Full audit trail

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/login | Authenticate user |
| POST | /api/v1/auth/register | Register new user |
| GET | /api/v1/auth/me | Get current user |
| POST | /api/v1/applications | Create application |
| GET | /api/v1/applications | List applications |
| POST | /api/v1/applications/:id/submit | Submit application |
| GET | /api/v1/cases | List cases |
| GET | /api/v1/cases/dashboard | Dashboard stats |
| GET | /api/v1/cases/:id | Get case details |
| POST | /api/v1/cases/:id/transition | Transition stage |
| POST | /api/v1/cases/:id/assign | Assign case |
| POST | /api/v1/customers | Create customer |
| GET | /api/v1/customers | Search customers |
| PATCH | /api/v1/customers/:id/kyc | Update KYC status |

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + TanStack Query + Zustand
- **Backend**: Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Auth**: JWT (15min access / 7d refresh)

## Phase 1 (Current) — MVP

- [x] Case management with stage-gate workflow
- [x] Application intake and submission
- [x] Basic decision engine with configurable rules
- [x] Customer management with KYC
- [x] Role-based access control
- [x] Dashboard with pipeline stats
- [x] SLA tracking
- [x] Audit trail

## Phase 2 (Planned)

- [ ] Document management with OCR
- [ ] Product catalog admin
- [ ] Credit bureau integration
- [ ] Compliance rules engine
- [ ] Advanced reporting

## Phase 3 (Future)

- [ ] Advanced decision strategies (A/B testing)
- [ ] Full regulatory reporting
- [ ] Multi-channel notifications
- [ ] White-labeling
- [ ] Multi-tenancy
