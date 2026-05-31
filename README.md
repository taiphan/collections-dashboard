<p align="center">
  <img src="logo.svg" alt="Collections Dashboard" width="120" height="120" />
</p>

<h1 align="center">Collections Dashboard</h1>

<p align="center">
  <strong>Debt collections management platform with real-time analytics and agent performance tracking.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-green" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06b6d4" alt="Tailwind" />
</p>

---

## Overview

Collections Dashboard is a comprehensive debt collections management system that provides real-time visibility into collection operations, agent performance, compliance monitoring, and strategy configuration.

## Features

- **Case Management** — Track and manage collection cases with status workflows
- **Analytics Dashboard** — Interactive charts and KPIs for collection performance
- **Agent Tracking** — Monitor agent productivity, call metrics, and outcomes
- **Scoring Engine** — Configurable scoring models for account prioritization
- **Compliance Module** — Regulatory compliance monitoring and audit trails
- **Strategy Builder** — Configure and manage collection strategies
- **Multi-Theme** — Light, dark, and system theme support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| UI Components | shadcn/ui + Base UI + Radix |
| Styling | Tailwind CSS v4 |
| State | Zustand with persistence |
| Charts | Recharts |
| Data Import | PapaParse (CSV) |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
cd collections-dashboard
npm install
```

### Development

```bash
npm run dev -- -p 3010
```

Open [http://localhost:3010](http://localhost:3010) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/
│   ├── ui/           # Reusable UI primitives
│   └── ...           # Feature components
└── lib/
    ├── store.ts      # Zustand state management
    └── utils.ts      # Utility functions
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
