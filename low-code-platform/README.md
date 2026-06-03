<h1 align="center">Low-Code Platform</h1>

<p align="center">
  <strong>Pega-inspired low-code platform — case management, forms, data models, SLAs. Multi-tenant from day one.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version" />
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06b6d4" alt="Tailwind" />
</p>

---

## Overview

A new platform that lets enterprise teams build operational apps (collections, loan origination, claims, service requests) through visual modeling instead of bespoke code. MVP ships **Case Management + Form Builder** on top of a multi-tenant foundation. See the spec at `.kiro/specs/low-code-platform/`.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| UI | shadcn/ui + Base UI + Radix |
| Styling | Tailwind CSS v4 |
| State | Zustand + Zod |
| ORM | Drizzle (Postgres 16) |
| Auth | NextAuth v5 (credentials, JWT) |
| Worker | Standalone Node process for SLAs + email |

## Prerequisites

- Node.js 20+
- Docker (for Postgres + MailHog in dev)

## Getting started

```bash
cd low-code-platform
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3020](http://localhost:3020).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3020 |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Project structure

```
low-code-platform/
├── proxy.ts               # Next.js 16 successor to middleware (tenant + auth resolution)
├── src/
│   ├── app/               # App Router routes
│   ├── components/
│   ├── lib/
│   └── styles/
├── drizzle/               # generated migrations
├── worker/                # SLA poller + notification dispatcher
└── tests/
```

> **Important** — this is Next.js 16. Conventions changed vs. earlier versions:
> middleware is now `proxy.ts`. Before adding any Next.js feature, consult
> `node_modules/next/dist/docs/`.

## License

MIT
