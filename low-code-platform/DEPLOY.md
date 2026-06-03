# Deploying the Low-Code Platform

The app ships as a Next.js **standalone** server plus a standalone **worker**
process, both containerized. A migrate job applies the schema before the web
container starts.

## Components

| Service | Image | Purpose |
|---------|-------|---------|
| `postgres` | `postgres:16-alpine` | Metadata + runtime data |
| `migrate` | `Dockerfile` target `migrate` | Applies `drizzle/*.sql` once, then exits |
| `web` | `Dockerfile` (standalone) | Next.js server on port 3020 |
| `worker` | `worker/Dockerfile` | SLA poller + email dispatcher |

## One-box deploy (docker compose)

```bash
cd low-code-platform
cp .env.production.example .env      # fill in real secrets
docker compose -f docker-compose.prod.yml up -d --build
```

Order is enforced by health checks: `postgres` → `migrate` (runs to completion)
→ `web`. The `worker` starts once Postgres is healthy.

Verify:

```bash
curl -fsS http://localhost:3020/api/health
# {"status":"ok","db":"up",...}
```

The `web` service sets `HOSTNAME=0.0.0.0` so the standalone server accepts probes on
`localhost:3020` inside the container (without it, Docker health checks may report
`unhealthy` even when the app responds on the host port).

## Required environment

See `.env.production.example`. The non-negotiable secrets:

- `AUTH_SECRET` — `openssl rand -base64 32`
- `POSTGRES_PASSWORD` / `DATABASE_URL`
- `AUTH_URL` — public origin, e.g. `https://app.example.com`
- `PLATFORM_ROOT_DOMAIN` — tenants resolve from subdomains of this in prod

## Migrations

The migrate job runs `node scripts/migrate.mjs`, which:

- creates a `_lcp_migrations` ledger table,
- applies each `drizzle/*.sql` in order inside a transaction,
- records applied tags so re-runs are no-ops.

To run migrations manually against a managed Postgres:

```bash
DATABASE_URL=postgres://... node scripts/migrate.mjs
```

## Platform-as-a-service notes

- **Vercel**: deploy the `web` service directly (it detects Next.js). Run the
  worker separately (a small VM, Fly Machine, or a scheduled function calling
  the dispatch loop). Point `DATABASE_URL` at a managed Postgres (Neon, Supabase, RDS).
  Run `node scripts/migrate.mjs` as a release/build step.
- **Fly.io / Render / Railway**: build from `Dockerfile`; add the worker as a
  second process/service from `worker/Dockerfile`; attach managed Postgres.
- **Kubernetes**: `web` Deployment + Service, `worker` Deployment, `migrate` as
  an init Job (or Helm hook). Use the `/api/health` endpoint for liveness +
  readiness probes.

## Multi-replica considerations

- Set `STORAGE_DRIVER=s3` (the local-fs adapter only works for a single web
  replica). The S3 adapter is stubbed — implement `src/lib/storage/s3.ts` before
  scaling out attachments.
- The worker uses Postgres `SKIP LOCKED`, so multiple worker replicas are safe.

## Production hardening still required (tracked, not yet done)

- TLS termination / reverse proxy (nginx, Caddy, or the platform's LB).
- Rate limiting on `/api/auth` and connector invocation.
- S3 storage adapter for attachments at >1 web replica.
- Secret management (do not bake secrets into images; use the platform's secret store).
- Backups + PITR on Postgres.
