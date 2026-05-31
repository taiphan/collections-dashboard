---
inclusion: always
---

# Project Overview & Development Workflow

## Tech Stack

| Layer | Primary Choice |
|-------|---------------|
| Frontend (SEO) | Next.js 14+ (App Router) |
| Frontend (Admin) | React + Vite (SPA) |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS |
| State | Zustand (global) + TanStack Query (server) |
| Backend | Express.js + Node.js 20 LTS |
| Language | TypeScript 5+ (strict mode) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache | Redis (ioredis) |
| Queue | BullMQ (default) |
| Auth | JWT + bcrypt (12 rounds) |
| Testing | Vitest + Testing Library + Playwright |
| CI/CD | GitHub Actions → GHCR → VPS (Docker) |
| Monitoring | Prometheus + Grafana + Pino |

## Development Workflow

```
/spec  →  /plan  →  /build  →  /test  →  /review  →  Ship
Define    Plan     Build     Verify    Review     Deploy
```

## Core Principles

- **Test-Driven Development** — Write failing tests first, then implement
- **Incremental Implementation** — Small vertical slices, always buildable
- **Five-Axis Review** — Correctness, Readability, Architecture, Security, Performance
- Progress over perfection
- Fix root causes, not symptoms
- The simplest thing that could work

## Architecture Flow

```
Request → Routes → Middleware → Controllers → Services → Repositories → Database
```

| Layer | Responsibility |
|-------|---------------|
| Presentation (`app/`) | HTTP handling |
| Business (`domain/`) | Business logic |
| Infrastructure (`infrastructure/`) | External services |
| Shared (`shared/`) | Cross-cutting concerns |
