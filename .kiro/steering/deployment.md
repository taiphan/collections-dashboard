---
inclusion: manual
---

# Deployment Workflow

## Pipeline: Build → Test → Deploy → Verify

## CI/CD Architecture

```
Push → GitHub Actions → Test → Build Docker → Push GHCR → Deploy VPS → Health Check → Notify
```

## Branch Protection (main)

- Require PR with 1+ approvals
- CI must pass (test-backend, test-frontend)
- No force pushes
- Include administrators

## Docker Image Tags

| Tag | Description |
|-----|-------------|
| `v1.x.x` | Specific version (immutable) |
| `latest` | Latest stable release |

## Deploy Steps

1. Verify clean state: `git status && git pull origin main`
2. Run tests: `npm test`
3. Build: `npm run build`
4. Deploy: `docker compose pull && docker compose up -d`
5. Health check: `curl -f http://localhost:3000/health`
6. Monitor logs for 30 seconds

## Rollback (30 seconds)

```bash
export TAG=v1.x.x  # previous version
docker compose up -d
curl http://localhost:3000/health
```

## Pre-Deploy Checklist

- [ ] All tests pass
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Security checklist verified
