---
inclusion: manual
---

# Performance Checklist

## Core Web Vitals Targets

| Metric | Good |
|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

## Frontend

- Minimize critical CSS (inline above-fold)
- Defer non-critical JavaScript
- Images: WebP/AVIF, lazy loading, srcset, explicit width/height
- Code splitting with dynamic imports
- Bundle size < 200KB initial JS
- Memoize expensive computations (useMemo)
- Virtualize long lists (react-window)

## Backend

- Indexes on queried columns
- No N+1 queries (use Prisma include)
- Pagination on all list endpoints
- Connection pooling configured
- Query timeouts set
- Cache frequently accessed data (Redis, appropriate TTLs)
- Response compression (gzip/brotli)
- Async operations for slow tasks

## Performance Budget

| Resource | Budget |
|----------|--------|
| Initial JS | < 200KB |
| Initial CSS | < 50KB |
| Total page weight | < 1MB |
| Time to Interactive | < 3s |
| API response (p95) | < 200ms |
