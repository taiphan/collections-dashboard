# Changelog

All notable changes to the Low-Code Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — worklist filters + SLA column + notification bell wired

- `/worklist` exposes filters by case type, stage (driven from the selected case type's published stages), status, SLA tier, and free-text identifier search. Filters persist via URL params and survive paging.
- New SLA column with `on_track` / `warning` / `breached` badges. SLA is computed server-side from each row's pinned case-type version, fetched in one batched query per page (no N+1).
- Cursor-based pagination wired through to the repo-level keyset query. "Next page" preserves the active filter set in the URL.
- The notification bell is now mounted in the app shell next to sign-out — the polling that was already implemented finally surfaces in the UI.
- Closes Requirements 8.3, 8.4, 8.7, 8.8 from the MVP gap list.

### Added — deployment artifacts

- **Standalone output**: `next.config.ts` now emits `output: 'standalone'` for slim container images.
- **Multi-stage `Dockerfile`**: `deps → build → migrate → runtime`. Runtime runs `node server.js` as a non-root user; a dedicated `migrate` stage carries `scripts/` + full deps.
- **`worker/Dockerfile`** for the SLA + email dispatcher.
- **`docker-compose.prod.yml`**: postgres → migrate (run-to-completion) → web (health-gated) → worker, with named volumes for data + attachment storage.
- **`scripts/migrate.mjs`**: dependency-light migration runner with a `_lcp_migrations` ledger so re-runs are idempotent.
- **`/api/health`** liveness/readiness endpoint (public; 200 when DB answers, 503 otherwise).
- **`.dockerignore`**, **`.env.production.example`**, **`.gitlab-ci.yml`** (lint/typecheck/unit/integration/build/image stages), and **`DEPLOY.md`**.
- Verified the standalone artifact boots and serves (`node .next/standalone/server.js`): landing 200, `/api/health` 503 with DB down, protected routes 307.

### Added — release approval gate (completes V2.H)

- Releases now carry an `approvalPolicy` (`none` | `single` | `dual`) and a `status` (`draft` | `approved` | `promoted`).
- New `release_approvals` table + `0004_release_approvals.sql` migration.
- `POST /api/releases/[id]/approve { decision, comment }` records an approve/reject. The author cannot self-approve (segregation of duties). Meeting the policy flips status to `approved`; any reject keeps it `draft`.
- `promote` is gated: a release with a policy must be `approved` first, else 409. On success the release is marked `promoted`.
- Release detail page shows status badge, approval ledger, an `ApprovalPanel`, and disables `PromotePanel` until the gate is met.
- Integration test `release-approval.test.ts` covers block-before-approval, no-self-approval, approve-then-promote, and target-tenant artifact creation.

### Fixed — runtime (found during build & run)

- **Proxy location**: moved `proxy.ts` → `src/proxy.ts`. With the app under `src/app`, Next.js 16 only detects the proxy when it sits beside `app` (i.e. inside `src/`). Previously unauthenticated page requests 500'd with `TenantUnresolvedError` because the auth/tenant guard never ran. Confirmed against `node_modules/next/dist/docs` (proxy convention + Node.js runtime default).
- **API auth responses**: the proxy now returns `401 { error: { code: 'unauthorized' } }` for unauthenticated `/api/*` requests instead of a 307 redirect to `/login`. Browser navigations still redirect.

### Verified by running `next start`

- Public pages (`/`, `/login`, `/signup`) → 200.
- Protected pages (`/worklist`, `/studio`, `/dashboard`, `/admin`) → 307 redirect to `/login?next=…`.
- API without auth → 401 JSON; API without tenant → 400 JSON.
- NextAuth handler (`/api/auth/providers`) → 200.

### Added — gap-fill round

- **Integration test harness**: Testcontainers-backed Postgres runner (`vitest.integration.config.ts`, `npm run test:integration`). Migrations are applied on container boot using the same SQL files Drizzle generates, with `--> statement-breakpoint` markers respected.
- **Property tests, DB-backed**:
  - Property 1 (tenant isolation): two tenants with overlapping artifact names — repos prove zero cross-tenant rows are visible.
  - Property 2 (pinned design version): create case → republish v2 → existing case still resolves v1 in `getCaseDetail`.
  - Property 3 (append-only audit): trigger rejects UPDATE and DELETE; INSERT still works.
  - Property 9 (notification fan-out): role of N members yields exactly N rows, all in the same tenant.
  - Property 10 (attachment tenant-prefix): every `storage_key` begins with `tenants/<tenantId>/` for its row.
- **Studio CRUD pages**:
  - `/studio/connectors` — list + REST connector example payload.
  - `/studio/decision-tables` — list with example payload, `/studio/decision-tables/[id]` shows the rule table.
  - `/studio/releases` — list, `/studio/releases/[id]` shows manifest + `PromotePanel` client component (target picker + typed-confirmation guard).
- **Branding settings UI** (`/admin/branding`): four-token form (primary, primary foreground, accent, radius) saving via `PUT /api/admin/tenant-tokens`. Server-rendered `<TenantTheme>` immediately applies tokens on next request.
- **Studio landing** now surfaces all six designer surfaces.

### Fixed

- `0001` and `0003` migrations now use Drizzle's `--> statement-breakpoint` separator so the integration runner can split + apply them.

### Added — connector_step + decision_step in case engine

- Two new step kinds in `CaseTypeDefinition`: `connector_step` and `decision_step`.
- `connector_step` resolves inputs from `primaryEntityData` (`$path` syntax), invokes the named connector, optionally maps the response back into case data, and chooses halt-or-continue on failure.
- `decision_step` maps case data into decision-table inputs, evaluates, optionally writes the outputs back into case data, and advances.
- Both run inside `autoAdvanceIfPossible`, so they execute server-side without any user interaction. Each invocation appends to `case_history` with the inputs, response/result, and any error so audits stay complete.
- Case Designer cross-checks `connectorId` and `decisionTableId` references at design time; missing references reject the publish/save with a clear validation error.
- BPMN canvas (V2.A) recognises both new kinds with the existing color-coded edges.
- 3 new tests covering schema acceptance, graph integration, and discriminated-union behaviour. Total: **49/49 passing**.

### Added (v2 pillars — partial)

- **V2.A Visual BPMN canvas** — read-only stage→step→transition graph rendered with `@xyflow/react`. Studio case-type detail page (`/studio/case-types/[id]`) shows the canvas with color-coded edges (approve / reject / send-back / conditional / fallthrough). Pure `lib/case-runtime/graph.ts` module so the layout logic is testable and reusable for an editable canvas later.
- **V2.B Constellation-style design tokens** — Zod-validated token schema (colors, radius, typography), per-tenant override stored as `tenants.design_tokens` JSON, server-rendered on every page via `<TenantTheme>` so first paint already reflects tenant brand. `PUT /api/admin/tenant-tokens` lets a Platform_Admin save tokens.
- **V2.D Decision tables** — full schema, deterministic evaluator with first-match semantics, default-row fallthrough, ops `==/!=/</<=/>/>=/in/between/any`. `POST /api/decision-tables`, `PATCH /api/decision-tables/[id]`, `POST /api/decision-tables/[id]/evaluate`.
- **V2.E REST connector** — pluggable `ConnectorAdapter` registry with a working `rest` adapter (configurable baseUrl, default headers, timeout, JSON body handling). `POST /api/connectors`, `POST /api/connectors/[id]/invoke`. SOAP/DB/file kinds wired but explicitly throw `not_implemented` until they ship.
- **V2.H Releases & promotion** — package published `entity` / `form` / `case_type` / `decision_table` versions into a named `Release`. `POST /api/releases/[id]/promote { targetTenantId }` re-creates each artifact in the target tenant, rewrites cross-references (entity ids on forms, form ids on case-types) by name. Property 2 holds — pre-existing cases keep their pinned versions.

### Stubbed (v2 pillars — adapters required)

- **V2.C GenAI Blueprint** — `lib/services/blueprint.ts` documents the LLM gateway, opt-out flag, transcript audit table, and rate-limit work needed before this can ship. Throws 501 until configured.
- **V2.F Hybrid RPA** — `lib/services/rpa.ts` exposes the call shape; needs a Robot_Registry adapter (UiPath / Pega Robot Manager / Blue Prism). Throws 501.
- **V2.G Data Flows** — `lib/services/data-flows.ts` exposes the pipeline shape; needs Kafka/webhook source adapters and a dead-letter store. Throws 501.
- **V2.I Customer Decision Hub** — optional adapter; absent config never blocks workflows.

### Migrations

- `0002_tenant_design_tokens.sql` — `tenants.design_tokens jsonb`
- `0003_v2_connectors_decisions_releases.sql` — `connectors`, `decision_tables`, `releases` tables with tenant-scoped unique indexes

### Tests

- 9 new tests across decision-table evaluator/schema and design-tokens schema. Total: **46/46 passing**.

### Pega-parity v2 roadmap

- Appended Pillars V2.A through V2.I to `requirements.md` covering visual BPMN designer, Constellation-style UI system, GenAI Blueprint, Process AI, integration connectors, RPA, data flows, governance + promotion, and Customer Decision Hub. References paraphrased from pega.com.

### Case detail UI controls

- manager actions (send back with reason, reassign), comments panel with optimistic refresh, attachments panel with file upload + download + delete.

### Added (initial)

- **Foundation** — Next.js 16 App Router project, Tailwind v4 theme, shadcn config, `proxy.ts` tenant + auth resolver.
- **Database** — Drizzle schema for 15 tables, generated migration, append-only audit trigger.
- **Auth** — NextAuth v5 with credentials provider, login + signup pages, RBAC helpers (`platform_admin`, `app_designer`, `case_worker`, `manager`).
- **Repository layer** — tenant-scoped repos for tenants, users, memberships, entities, forms, case types, cases (keyset paginated), notifications, attachments, comments, audit log.
- **Validation** — Zod schemas for `EntityDefinition`, `FormDefinition`, `CaseTypeDefinition` plus identifier rules and the form-component-to-field-type compatibility table (Property 7).
- **Expression evaluator** — pure deterministic evaluator (Property 6) for visibility rules and conditional transitions.
- **Services**
  - Audit (append-only emitter)
  - Data Model (Requirement 3)
  - Form Designer (Requirement 5)
  - Case Designer (Requirement 4 with Property 5 enforcement)
  - Case Runtime (Requirement 6 — full transition engine: form_step / approval_step / automated_step / notification_step, conditional + send-back transitions, reassign, resolve)
  - SLA Engine (Requirement 9, Property 8)
  - Notifications (Requirement 13, Property 9 fan-out)
  - Attachments (Requirement 14, Property 10 tenant-prefix)
  - Comments (Requirement 14)
  - Manager Dashboard (Requirement 15)
  - Admin (tenant + member CRUD)
- **API routes** — `/api/entities`, `/api/forms`, `/api/case-types`, `/api/cases`, `/api/notifications`, `/api/attachments`, `/api/comments`, `/api/dashboard`, `/api/admin/*`.
- **UI**
  - App shell with role-gated navigation
  - Studio landing + lists (data models, forms, case types)
  - Worklist with case rows
  - Case detail view with stage progress, current-step renderer, history, SLA badge
  - New-case wizard
  - Manager dashboard with cases-by-stage / SLA / workload tiles
  - Admin members page
- **Form Renderer** — shared by designer preview + runtime, full keyboard support, visibility + validation engine.
- **Worker** — separate Node process with SLA poller and notification dispatcher (SMTP via MailHog in dev), `SKIP LOCKED`, exponential-backoff retries.
- **Seed script** — bootstraps an `acme` tenant with admin + worker, sample loan-origination case type with form_step + approval_step + send-back.
- **Tests** — 37 unit tests across expression evaluator, tenant resolver, validation schemas, SLA engine, case walker.

[Unreleased]: https://example.com/diff/HEAD
