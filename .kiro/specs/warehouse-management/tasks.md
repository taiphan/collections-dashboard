# Implementation Plan:

## Overview

This plan implements the Warehouse Management System (WMS) in 23 incremental tasks. Each task produces a buildable, testable vertical slice. Tasks are ordered by dependency — infrastructure first, then core domain, then features that build on the core.

## Tasks

- [x] 1. Project Scaffolding and Infrastructure Setup
  Create `warehouse-management/` directory structure with `backend/` and `frontend/` subdirectories. Initialize backend with `package.json` (Express, Prisma, Zod, bcrypt, jsonwebtoken, ioredis, bullmq, pino, helmet, cors, compression). Configure `tsconfig.json` with strict mode and path aliases. Create `vitest.config.ts`, `.env.example`, `docker-compose.yml` (PostgreSQL 16, Redis 7), and `Dockerfile`. Initialize frontend with Vite + React + TypeScript. Configure Tailwind CSS and shadcn/ui.
  Requirements: None (infrastructure)

- [x] 2. Database Schema and Prisma Setup
  Create `prisma/schema.prisma` with all models (User, CatalogItem, Sku, Barcode, InventoryRecord, WarehouseOperation, OperationLineItem, OperationStatusLog, AuditLog, ReportCache, Prediction). Define all enums. Add unique constraints and database indexes. Create initial migration. Create `prisma/seed.ts` with sample admin user. Create Prisma client singleton.
  Requirements: Req 1, 2, 3, 4, 5, 6, 12

- [x] 3. Shared Utilities and Error Handling
  Create `src/shared/config/env.ts` with Zod-validated environment variables. Create custom error classes (ValidationError, NotFoundError, ConflictError, ForbiddenError, UnauthorizedError). Create pagination helper, date range utilities, and shared TypeScript interfaces.
  Requirements: Req 7, 8

- [x] 4. Authentication and Authorization
  Create AuthService with login, refresh, logout. Create auth middleware (JWT verification, role checking). Create rate-limit middleware (Redis-backed, 5 attempts/15min for auth). Implement bcrypt password hashing (12 rounds), JWT access token (15min) and refresh token (7d). Create auth controller and routes.
  Requirements: Req 11

- [x] 5. Catalog Item Management
  Create catalog validation schemas (Zod), repository (CRUD, pagination, search), and service (unique name+category check, deletion guard). Create controller with GET/POST/PUT/DELETE handlers. Implement partial text matching search. Integrate audit logging.
  Requirements: Req 1, 12

- [x] 6. SKU and Barcode Management
  Create SKU validation schemas, barcode validator (EAN-13, UPC-A, Code 128 with check digit verification), repository, and service. Enforce unique codes, max 100 SKUs/item, max 10 barcodes/SKU. Implement barcode lookup with Redis caching (< 200ms). Initialize InventoryRecord on SKU creation.
  Requirements: Req 2, 6, 12

- [x] 7. Warehouse Operations and Workflow
  Create operation validation schemas, workflow service (state machine with allowed transitions, creator-cannot-approve rule), repository, and service. Create controller with create/update/submit/approve/reject/cancel endpoints. Auto-generate operation numbers. Validate SKU existence. Enforce line item limits. Record status transitions.
  Requirements: Req 3, 4, 5

- [x] 8. Inventory Management with Atomic Updates
  Create inventory validation, repository (atomic updates), and service (approval-triggered updates, stock validation, low-stock detection). Add database CHECK constraint (quantity >= 0). Implement stock insufficiency check before export approval. Implement threshold configuration.
  Requirements: Req 6, 3, 4

- [x] 9. Product Query and Filtering
  Create PostgreSQL full-text search vector on catalog_items with GIN index. Create filter validation, repository (complex query builder with multi-criteria AND, sorting, pagination), and service (stock status classification, top-exported ranking). Implement date range validation. Optimize for < 500ms on 100K SKUs.
  Requirements: Req 7

- [x] 10. Periodic Reporting
  Create report validation, repository (aggregation queries), report generator (metrics calculation), and service (cache-first strategy). Implement Redis + DB caching with invalidation on new approvals. Implement PDF export (pdfkit) and CSV export. Create BullMQ worker for background generation.
  Requirements: Req 8

- [x] 11. Analytics and Trend Analysis
  Create analytics validation, repository (aggregation queries), trend calculator (linear regression), and service (moving averages, turnover rate, seasonal detection). Implement 7/30/90-day moving averages. Implement minimum data validation (90 days for trends). Compute all metrics from Approved operations only.
  Requirements: Req 9

- [x] 12. Predictive Sales and Import Planning
  Create prediction service with Holt-Winters exponential smoothing. Implement 30-day daily forecast for SKUs with >= 180 days history. Implement confidence intervals (10th/50th/90th percentile). Implement reorder quantity calculation and alert detection. Create BullMQ scheduled job for daily refresh with failure handling.
  Requirements: Req 10

- [x] 13. Audit Log System
  Create audit service (append-only log creation) and repository (filtered queries). Create controller with query endpoint. Integrate into all domain services. Ensure writes within same transaction. Target < 2s for 90-day queries. Add DB migration to REVOKE UPDATE/DELETE on audit_logs.
  Requirements: Req 12

- [x] 14. Express Server and Middleware Assembly
  Create server.ts with Express initialization, middleware stack (Helmet, CORS, compression, Pino logging), and route mounting under `/api/v1`. Create centralized error handler (generic messages in production). Create Zod validation middleware wrapper. Create Redis and BullMQ client singletons.
  Requirements: Req 11, 12

- [x] 15. Frontend - Project Setup and Layout
  Initialize React + Vite + TypeScript frontend. Install shadcn/ui, Tailwind, TanStack Query, Zustand, React Router, React Hook Form, Zod, Recharts. Create API service with JWT interceptor. Create auth store. Create main layout with sidebar navigation. Create login page.
  Requirements: Req 11

- [x] 16. Frontend - Catalog and SKU Pages
  Create catalog list page (data table, search, pagination), form page (create/edit), and detail page (SKU list, barcode management). Create SKU table and barcode form components. Create TanStack Query hooks. Implement barcode scanner input support.
  Requirements: Req 1, 2

- [x] 17. Frontend - Operations and Workflow Pages
  Create operation list (tabbed Imports/Exports, status filters), create import/export forms, and operation detail page (status timeline, approve/reject actions). Create status badge and line item table components. Implement approval/rejection dialogs. Use optimistic updates.
  Requirements: Req 3, 4, 5

- [x] 18. Frontend - Inventory and Product Search Pages
  Create inventory list (real-time stock table, status badges), inventory detail (history, threshold config), and product search page (multi-criteria filter panel). Create stock badge and threshold dialog components. Implement auto-refresh polling.
  Requirements: Req 6, 7

- [x] 19. Frontend - Reports Pages
  Create report dashboard with period selector. Create summary cards, top products table, and financial summary components. Implement PDF/CSV export buttons. Create date range picker.
  Requirements: Req 8

- [x] 20. Frontend - Analytics and Predictions Pages
  Create analytics dashboard with chart grid. Create moving average chart, top products chart, turnover table, trend chart, and seasonal chart components (Recharts). Create predictions page with forecast charts and reorder alerts table. Implement insufficient data messaging.
  Requirements: Req 9, 10

- [x] 21. Frontend - Dashboard Page
  Create dashboard with overview cards (total SKUs, pending operations, low stock count). Create stats cards, recent activity feed, low stock alerts, and quick actions components.
  Requirements: Req 6, 7, 9

- [ ] 22. Integration Testing and E2E Setup
  Write integration tests for auth flow, catalog CRUD, operation workflow, inventory atomic updates, product search, and report generation. Configure Playwright. Write E2E tests for complete import and export workflows.
  Requirements: All

- [ ] 23. Documentation and Deployment Configuration
  Create README.md, OpenAPI 3.0 spec, docker-compose.prod.yml, GitHub Actions CI/CD pipelines (lint, test, build, deploy). Document environment variables. Add npm audit to CI.
  Requirements: All

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3] },
    { "wave": 4, "tasks": [4] },
    { "wave": 5, "tasks": [5] },
    { "wave": 6, "tasks": [6] },
    { "wave": 7, "tasks": [7] },
    { "wave": 8, "tasks": [8, 14] },
    { "wave": 9, "tasks": [9, 10, 11, 13, 15] },
    { "wave": 10, "tasks": [12, 16, 17, 18] },
    { "wave": 11, "tasks": [19, 20, 21] },
    { "wave": 12, "tasks": [22] },
    { "wave": 13, "tasks": [23] }
  ]
}
```

## Notes

- Tasks 1-14 are backend tasks and should be completed sequentially
- Tasks 15-21 are frontend tasks that can begin after Task 14 (server assembly) and proceed in parallel
- Task 22 (testing) depends on both backend (Task 14) and can run alongside frontend development
- Task 23 (documentation) should be done last after all features are implemented
- Each task should produce working, testable code — no partial implementations
- Follow existing project patterns from `los-system/` for consistency
