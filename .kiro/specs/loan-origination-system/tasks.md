# Implementation Plan: Loan Origination System (CRIF-Inspired)

## Overview

This plan implements an enterprise-grade LOS with visual Decision Engine, Open Banking integration, ESG scoring, and low-code workflow orchestration. Tasks build foundational infrastructure first, then layer domain services, UI, and advanced features incrementally.

## Tasks

- [ ] 1. Project scaffolding and infrastructure
  - [ ] 1.1 Initialize backend project with Express + TypeScript
    - Create `los-system/backend/` with package.json, tsconfig.json, .env.example
    - Install: express, helmet, cors, zod, prisma, ioredis, bullmq, bcrypt, jsonwebtoken, pino, uuid
    - Set up shared config (Zod-validated env), error classes, logger, ID generator
    - _Requirements: NFR-1, NFR-3, NFR-5_

  - [ ] 1.2 Set up Prisma schema — core models
    - Create schema.prisma with: User, Customer, LoanProduct, Application, Case, CaseTask, CaseActivity, StageHistory, Decision, DecisionRule, DecisionRuleSet, Document, WorkflowTemplate, SlaConfig
    - Define all enums: UserRole, CaseStage, CaseStatus, CasePriority, ApplicationStatus, etc.
    - Configure indexes for query performance
    - _Requirements: FR-1, FR-2, FR-3, FR-6_

  - [ ] 1.3 Set up Redis cache and BullMQ queue infrastructure
    - Create cache service (get/set/delete/pattern-delete)
    - Create queue definitions: case-processing, sla-monitor, decision-engine, notifications
    - Define job interfaces and enqueue helpers
    - _Requirements: NFR-2.3, NFR-1_

  - [ ] 1.4 Set up Docker Compose for local development
    - PostgreSQL 16, Redis 7, backend service
    - Health checks, volume mounts, environment variables
    - _Requirements: NFR-2.1_

  - [ ] 1.5 Initialize frontend project with React + Vite
    - Create `los-system/frontend/` with package.json, tsconfig.json, vite.config.ts
    - Install: react, tailwindcss, @tanstack/react-query, zustand, @radix-ui/*, lucide-react
    - Set up Tailwind config with LOS-specific colors (stage, priority)
    - Create API client, auth store, type definitions
    - _Requirements: FR-10, NFR-1.1_

- [ ] 2. Authentication and authorization
  - [ ] 2.1 Implement auth service (login, register, JWT)
    - bcrypt password hashing (12 rounds), JWT access (15m) + refresh (7d) tokens
    - Auth middleware, role-based authorize middleware
    - _Requirements: NFR-3.1, NFR-3.4_

  - [ ] 2.2 Implement RBAC with fine-grained permissions
    - Roles: ADMIN, MANAGER, UNDERWRITER, LOAN_OFFICER, COMPLIANCE_OFFICER, VIEWER
    - Permission matrix per endpoint
    - Four-eyes principle for sensitive operations
    - _Requirements: NFR-3.1, FR-3.16_

  - [ ] 2.3 Create login page and auth flow in frontend
    - Login form, token storage, auto-refresh, logout
    - Protected route wrapper
    - _Requirements: FR-10.1_

- [ ] 3. Customer management
  - [ ] 3.1 Implement customer service (CRUD, search, KYC)
    - Create, update, search (fuzzy), get by ID with relationships
    - KYC status management, risk profiling
    - _Requirements: FR-6.1–6.5_

  - [ ] 3.2 Implement customer API routes
    - POST/GET /customers, GET /customers/:id, PATCH /customers/:id/kyc
    - GET /customers/:id/risk-profile
    - Zod validation on all inputs
    - _Requirements: FR-6.1–6.5_

  - [ ] 3.3 Create customer UI components
    - Customer search, customer detail (360° view), KYC status badge
    - _Requirements: FR-6.1, FR-10.4_

- [ ] 4. Product catalog
  - [ ] 4.1 Implement product service
    - CRUD for loan products, eligibility check, amortization calculation
    - Active product listing with effective date filtering
    - Risk-based pricing calculation
    - _Requirements: FR-5.1–5.7_

  - [ ] 4.2 Implement product API routes
    - POST/GET/PATCH /products, GET /products/active, POST /products/:id/eligibility
    - POST /products/amortization
    - _Requirements: FR-5.1–5.7_

  - [ ] 4.3 Create product catalog UI
    - Product cards grid, loan calculator with amortization table
    - _Requirements: FR-5.1, FR-10.4_

- [ ] 5. Pre-screening engine
  - [ ] 5.1 Implement pre-screening service
    - Accept minimal applicant data, run eligibility rules per product
    - Integrate with credit bureau (soft check) and Open Banking (if consented)
    - Return instant eligibility result with max amount and indicative rate
    - Cache pre-qualification results (valid 30 days)
    - _Requirements: FR-1.3, FR-1.4, FR-1.11, FR-1.12_

  - [ ] 5.2 Implement pre-screening API routes
    - POST /api/v1/pre-screening/check
    - GET /api/v1/pre-screening/:id/result
    - _Requirements: FR-1.3, FR-1.11_

  - [ ] 5.3 Create pre-screening UI
    - Quick eligibility form (minimal fields), instant result display
    - Show max eligible amount, indicative rate, next steps
    - _Requirements: FR-1.3, FR-1.11, NFR-1.4_

- [ ] 6. Application intake
  - [ ] 6.1 Implement application service
    - Create (draft), submit, list, get by ID
    - Validate against product limits (amount, tenure)
    - Deduplication detection on submit
    - Co-applicant and guarantor support
    - _Requirements: FR-1.1, FR-1.2, FR-1.5, FR-1.7, FR-1.10_

  - [ ] 6.2 Implement application API routes
    - POST/GET /applications, GET /applications/:id, POST /applications/:id/submit
    - _Requirements: FR-1.1, FR-1.6_

  - [ ] 6.3 Create multi-step application wizard UI
    - Steps: Product → Applicant → Loan Details → Documents → Review & Submit
    - Save & resume, dynamic fields per product type
    - _Requirements: FR-1.2, FR-1.6, FR-10.3_

- [ ] 7. Case management & workflow engine
  - [ ] 7.1 Implement case service (core)
    - Create case from submitted application
    - Stage transitions with validation (entry/exit criteria)
    - Auto-generate tasks per stage from workflow template
    - SLA deadline calculation and tracking
    - _Requirements: FR-2.1, FR-2.3, FR-2.6_

  - [ ] 7.2 Implement task service
    - Task CRUD, status transitions, assignment
    - Task completion triggers (check if all stage tasks done)
    - _Requirements: FR-2.4_

  - [ ] 7.3 Implement workflow template service
    - CRUD for workflow definitions (JSON-based stage/task/transition config)
    - Workflow versioning, activation/deactivation
    - _Requirements: FR-2.2, FR-2.11, FR-2.16_

  - [ ] 7.4 Implement auto-assignment service
    - Round-robin, skill-based, workload-based assignment strategies
    - Configurable per stage and product type
    - _Requirements: FR-2.5_

  - [ ] 7.5 Implement SLA monitoring worker (BullMQ)
    - Periodic scan (every 5 min) for approaching/breached deadlines
    - Warning and breach activities logged, escalation triggered
    - _Requirements: FR-2.6_

  - [ ] 7.6 Implement case API routes
    - GET /cases, GET /cases/:id, POST /cases/:id/transition
    - POST /cases/:id/assign, PATCH /cases/:id/priority
    - GET /cases/dashboard (stats)
    - PATCH /cases/:caseId/tasks/:taskId
    - _Requirements: FR-2.1–2.10_

  - [ ] 7.7 Create case list UI with filters
    - Table with stage/status/priority/SLA columns
    - Filter by stage, status, assigned officer
    - _Requirements: FR-10.2_

  - [ ] 7.8 Create case detail UI
    - Stage progress bar, task list with completion, activity feed
    - Stage transition actions, priority/assignment controls
    - _Requirements: FR-10.3, FR-10.4_

- [ ] 8. Decision engine — core
  - [ ] 8.1 Implement rule-based decision engine service
    - Load rule sets from database, evaluate conditions against application context
    - Support operators: eq, neq, gt, gte, lt, lte, in, between
    - Score calculation with weighted factors
    - Built-in rules: DTI, LTV, DSCR, credit score thresholds
    - _Requirements: FR-3.1, FR-3.2, FR-3.5, FR-3.11_

  - [ ] 8.2 Implement decision execution and storage
    - Execute decision, store outcome with full reasoning
    - Log activity on case, auto-complete underwriting tasks if STP
    - _Requirements: FR-3.4, FR-3.10_

  - [ ] 8.3 Implement decision engine worker (BullMQ)
    - Async evaluation for complex rule sets
    - Build evaluation context from customer + application + bureau data
    - _Requirements: FR-3.4, NFR-1.3_

  - [ ] 8.4 Implement decision API routes
    - POST /api/v1/cases/:id/evaluate — trigger decision
    - GET /api/v1/cases/:id/decisions — list decisions for case
    - _Requirements: FR-3.1, FR-3.10_

- [ ] 9. Document management
  - [ ] 9.1 Implement document service
    - Upload with type/size validation, verify, checklist generation
    - Completeness check, expiry tracking
    - _Requirements: FR-4.1–4.5, FR-4.8_

  - [ ] 9.2 Implement document API routes
    - POST /documents, PATCH /documents/:id/verify
    - GET /applications/:id/documents/checklist
    - GET /applications/:id/documents/completeness
    - _Requirements: FR-4.1–4.5_

  - [ ] 9.3 Create document checklist UI
    - Checklist with upload/review status, completeness progress bar
    - _Requirements: FR-4.1, FR-10.4_

- [ ] 10. Integration hub — core
  - [ ] 10.1 Implement integration service with circuit breaker
    - Credit bureau pull (simulated), KYC verification, disbursement
    - Circuit breaker pattern (5 failures → open → 60s timeout → half-open)
    - _Requirements: FR-9.1, FR-9.4, NFR-4.3_

  - [ ] 10.2 Implement integration API routes
    - POST /integrations/credit-check
    - POST /integrations/kyc-verify
    - POST /integrations/disburse
    - _Requirements: FR-9.1, FR-9.2, FR-9.4_

- [ ] 11. Compliance — basic
  - [ ] 11.1 Implement compliance rule engine
    - AML screening, sanctions check (OFAC/PEP), KYC validation
    - Compliance audit trail (tamper-proof, append-only)
    - _Requirements: FR-8.1–8.4, FR-8.8_

  - [ ] 11.2 Implement compliance API routes
    - POST /compliance/screen — run AML + sanctions
    - GET /compliance/audit/:caseId — audit trail
    - _Requirements: FR-8.1–8.4_

- [ ] 12. Reporting — basic
  - [ ] 12.1 Implement reporting service
    - Pipeline report, TAT report, officer performance, portfolio summary
    - Redis-cached with 2-min TTL
    - _Requirements: FR-11.1–11.3_

  - [ ] 12.2 Implement reporting API routes
    - GET /reports/pipeline, /reports/tat, /reports/officers, /reports/portfolio
    - _Requirements: FR-11.1–11.3_

  - [ ] 12.3 Create reporting dashboard UI
    - KPI cards, TAT bar chart, officer performance table, status distribution
    - _Requirements: FR-11.1–11.3, FR-11.7_

- [ ] 13. Disbursement service
  - [ ] 13.1 Implement disbursement service
    - Initiate disbursement (validate case is approved + documented)
    - Integrate with core banking (simulated), confirm transfer
    - Auto-transition case to CLOSED on successful disbursement
    - _Requirements: FR-12.1–12.7_

  - [ ] 13.2 Implement disbursement API routes
    - POST /disbursements/initiate, GET /disbursements/:id/status
    - POST /disbursements/:id/confirm
    - _Requirements: FR-12.1–12.7_

- [ ] 14. Dashboard and navigation (full UI)
  - [ ] 14.1 Create main layout with sidebar navigation
    - Dashboard, Cases, Applications, Customers, Products, Reports, Admin
    - Role-based menu visibility
    - _Requirements: FR-10.1, FR-10.2_

  - [ ] 14.2 Create dashboard home with KPI widgets
    - Active cases, SLA breached, auto-approval rate, time-to-yes
    - Pipeline by stage chart, quick actions
    - _Requirements: FR-11.7, FR-11.11_

  - [ ] 14.3 Wire all views together with routing
    - Case list → case detail, application list → wizard, customer search → detail
    - _Requirements: FR-10.1–10.5_

- [ ] 15. Database seed and verification
  - [ ] 15.1 Create comprehensive seed data
    - Users (all roles), loan products (3+), SLA configs, decision rules
    - Sample customers, applications, cases in various stages
    - _Requirements: All_

  - [ ] 15.2 Verify end-to-end flow
    - Login → Create customer → Create application → Submit → Case created → Process through stages → Decision → Disburse
    - _Requirements: All Phase 1_

- [ ] 16. Open Banking service
  - [ ] 16.1 Implement Open Banking connection service
    - OAuth consent flow (simulated), account listing, transaction retrieval
    - Store connections with consent expiry tracking
    - _Requirements: FR-7.1, FR-7.6_

  - [ ] 16.2 Implement transaction categorization engine
    - Rule-based + keyword matching categorization (90%+ target)
    - Categories: salary, rent, utilities, transport, food, debt_repayment, gambling, etc.
    - Recurring transaction detection
    - _Requirements: FR-7.2, FR-7.4_

  - [ ] 16.3 Implement affordability assessment
    - Calculate income (salary + regular), expenses by category, disposable income
    - Determine max affordable monthly payment
    - Income stability scoring, risk indicator detection
    - _Requirements: FR-7.3, FR-7.4, FR-7.5_

  - [ ] 16.4 Implement Open Banking API routes
    - POST /open-banking/connect, GET /open-banking/:customerId/accounts
    - GET /open-banking/:customerId/transactions
    - POST /open-banking/:customerId/affordability
    - _Requirements: FR-7.1–7.8_

  - [ ] 16.5 Create Open Banking UI components
    - Bank connection flow, transaction list with categories, affordability report
    - _Requirements: FR-7.1, FR-10.4_

- [ ] 17. Visual Decision Engine (Strategy Designer)
  - [ ] 17.1 Extend Prisma schema for strategies
    - decision_strategies, champion_challengers, simulations tables
    - Strategy status lifecycle: draft → testing → champion/challenger → retired
    - _Requirements: FR-3.1, FR-3.7, FR-3.8_

  - [ ] 17.2 Implement strategy service
    - CRUD for decision strategies (node-based JSON structure)
    - Strategy deployment (activate version)
    - Strategy execution (traverse node graph, evaluate at each node)
    - _Requirements: FR-3.1, FR-3.15, FR-3.18_

  - [ ] 17.3 Implement what-if simulation service
    - Replay historical applications through a strategy
    - Calculate approval/rejection/referral rates, expected loss
    - Compare against champion strategy
    - Run as BullMQ job for large datasets
    - _Requirements: FR-3.7_

  - [ ] 17.4 Implement champion-challenger service
    - Set up A/B test between two strategies
    - Deterministic traffic routing (hash-based)
    - Metrics collection and comparison
    - _Requirements: FR-3.8_

  - [ ] 17.5 Implement strategy API routes
    - POST/GET/PUT /strategies, POST /strategies/:id/deploy
    - POST /strategies/:id/simulate, POST /strategies/champion-challenger
    - GET /strategies/champion-challenger/:id/results
    - _Requirements: FR-3.7, FR-3.8_

  - [ ] 17.6 Create visual strategy designer UI
    - Drag-and-drop canvas with node types (rule, scorecard, decision table, split, merge)
    - Node configuration panels, connection drawing
    - Strategy status badge, deploy button
    - _Requirements: FR-3.1, FR-10.11_

  - [ ] 17.7 Create what-if simulation UI
    - Dataset selection, run simulation, results comparison table
    - Approval rate delta, loss rate delta, revenue impact
    - _Requirements: FR-3.7, FR-10.12_

  - [ ] 17.8 Create champion-challenger dashboard
    - Active tests, traffic split, live metrics comparison
    - Promote challenger / end test actions
    - _Requirements: FR-3.8, FR-11.10_

- [ ] 18. ESG scoring module
  - [ ] 18.1 Implement ESG scoring service
    - Configurable ESG criteria (environmental, social, governance factors)
    - Score calculation with weighted factors
    - Pricing adjustment based on ESG score (basis points)
    - _Requirements: FR-3.14, FR-5.9_

  - [ ] 18.2 Implement ESG API routes
    - POST /esg/score — calculate ESG score for application
    - GET /esg/criteria — list configurable criteria
    - _Requirements: FR-3.14_

  - [ ] 18.3 Create ESG score display in case detail
    - ESG breakdown (E/S/G), pricing impact, factor details
    - _Requirements: FR-3.14, FR-10.4_

- [ ] 19. Advanced compliance
  - [ ] 19.1 Implement fair lending analysis
    - Statistical analysis for disparate impact detection
    - _Requirements: FR-8.5_

  - [ ] 19.2 Implement automatic audit documentation
    - Generate decision explanation documents from engine output
    - Full explainability for regulatory inquiries
    - _Requirements: FR-8.9, FR-8.10_

  - [ ] 19.3 Implement regulatory reporting
    - Configurable report templates, scheduled generation
    - Export to CSV/PDF
    - _Requirements: FR-8.2, FR-11.5_

- [ ] 20. Advanced reporting & analytics
  - [ ] 20.1 Implement decision engine analytics
    - Strategy effectiveness metrics, score distribution charts
    - Auto-approval rate tracking over time
    - _Requirements: FR-11.9, FR-11.10_

  - [ ] 20.2 Implement time-to-yes / time-to-cash tracking
    - Measure from submission to decision, decision to disbursement
    - Target: decisions within 15 minutes for STP
    - _Requirements: FR-11.11_

  - [ ] 20.3 Implement underwriting capacity metrics
    - Cases per underwriter, utilization rate, bottleneck detection
    - _Requirements: FR-11.12_

  - [ ] 20.4 Create advanced analytics dashboard
    - Decision engine performance, time-to-yes trends, capacity utilization
    - Custom report builder with export
    - _Requirements: FR-11.4–11.12_

- [ ] 21. Low-code workflow designer
  - [ ] 21.1 Implement workflow definition service
    - Visual workflow CRUD (stages, transitions, triggers as JSON)
    - Workflow versioning and activation
    - Validate workflow graph (no orphan stages, reachable end state)
    - _Requirements: FR-2.2, FR-2.11, FR-2.16_

  - [ ] 21.2 Implement workflow trigger engine
    - Event-driven triggers: stage_enter, stage_exit, task_complete, sla_breach
    - Actions: create_document, send_notification, call_api, update_field
    - _Requirements: FR-2.12, FR-2.13_

  - [ ] 21.3 Create visual workflow designer UI
    - Drag-and-drop stage nodes, transition arrows, trigger configuration
    - Live preview of workflow execution path
    - _Requirements: FR-2.2, FR-10.13_

  - [ ] 21.4 Create process monitoring dashboard
    - Real-time view of all active cases by workflow stage
    - Bottleneck detection, SLA heatmap
    - _Requirements: FR-2.14, FR-10.13_

- [ ] 22. Advanced UI features
  - [ ] 22.1 Implement real-time notifications
    - WebSocket or SSE for live updates (case assigned, SLA warning, decision made)
    - Notification bell with unread count
    - _Requirements: FR-10.5_

  - [ ] 22.2 Implement case collaboration
    - Comments with @mentions, file attachments on comments
    - Internal vs external comment visibility
    - _Requirements: FR-10.6_

  - [ ] 22.3 Implement white-labeling and theming
    - CSS variable-based theming, logo/color customization
    - _Requirements: FR-10.9_

  - [ ] 22.4 Implement keyboard shortcuts
    - Navigation shortcuts, action shortcuts (approve, reject, assign)
    - _Requirements: FR-10.10_

- [ ] 23. Final verification and hardening
  - [ ] 23.1 Run full TypeScript build, fix all errors
  - [ ] 23.2 Verify complete loan lifecycle end-to-end
  - [ ] 23.3 Verify decision engine executes strategies correctly
  - [ ] 23.4 Verify Open Banking affordability calculation
  - [ ] 23.5 Verify SLA monitoring and escalation
  - [ ] 23.6 Security review (no hardcoded secrets, PII masking, RBAC enforcement)

## Notes

- Phase 1 (Tasks 1–15): Core origination with basic decision engine
- Phase 2 (Tasks 16–18): Open Banking, visual decision engine, ESG
- Phase 3 (Tasks 19–22): Advanced compliance, analytics, workflow designer, UI polish
- Task 23: Final verification across all phases
- Decision Engine visual designer (Task 17.6) may use React Flow library
- Open Banking integration uses simulated providers initially (real API adapters later)
- ESG scoring criteria are configurable — no single standard mandated
- All workers (SLA, decision, notifications) run via BullMQ on Redis

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.5"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1", "3.2", "4.1", "4.2"] },
    { "id": 4, "tasks": ["3.3", "4.3", "5.1", "5.2", "6.1", "6.2"] },
    { "id": 5, "tasks": ["5.3", "6.3", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 6, "tasks": ["7.5", "7.6", "7.7", "7.8", "8.1", "8.2"] },
    { "id": 7, "tasks": ["8.3", "8.4", "9.1", "9.2", "9.3", "10.1", "10.2"] },
    { "id": 8, "tasks": ["11.1", "11.2", "12.1", "12.2", "12.3", "13.1", "13.2"] },
    { "id": 9, "tasks": ["14.1", "14.2", "14.3", "15.1", "15.2"] },
    { "id": 10, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5"] },
    { "id": 11, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5"] },
    { "id": 12, "tasks": ["17.6", "17.7", "17.8", "18.1", "18.2", "18.3"] },
    { "id": 13, "tasks": ["19.1", "19.2", "19.3", "20.1", "20.2", "20.3", "20.4"] },
    { "id": 14, "tasks": ["21.1", "21.2", "21.3", "21.4"] },
    { "id": 15, "tasks": ["22.1", "22.2", "22.3", "22.4"] },
    { "id": 16, "tasks": ["23.1", "23.2", "23.3", "23.4", "23.5", "23.6"] }
  ]
}
```
