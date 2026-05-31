# Design Document

## Overview

The Warehouse Management System (WMS) is a new module within the project monorepo, following the same architecture as the existing `los-system`. It provides catalog management, SKU/barcode tracking, import/export workflows with approval, inventory tracking, reporting, analytics, and predictive planning. The system is built as a standalone service (`warehouse-management/`) with its own backend (Express.js + Prisma) and frontend (React + Vite SPA).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Admin SPA (React + Vite)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Catalog  │ │Operations│ │Inventory │ │ Reports  │ │Analytics │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Express.js API Gateway                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Middleware: Auth → RateLimit → Validation → ErrorHandler     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Domain / Service Layer                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  PostgreSQL   │  │    Redis     │  │   BullMQ     │               │
│  │  (Prisma ORM) │  │   (Cache)    │  │   (Queue)    │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. AuthService
- `login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>`
- `refreshToken(token: string): Promise<{ accessToken: string }>`
- `logout(refreshToken: string): Promise<void>`
- Handles JWT issuance (15min access, 7d refresh), bcrypt password verification (12 rounds), rate limiting via Redis

#### 2. CatalogService
- `create(data: CreateCatalogItemDto, actorId: string): Promise<CatalogItem>`
- `update(id: string, data: UpdateCatalogItemDto, actorId: string): Promise<CatalogItem>`
- `delete(id: string, actorId: string): Promise<void>`
- `findById(id: string): Promise<CatalogItem>`
- `findAll(params: CatalogListParams): Promise<PaginatedResponse<CatalogItem>>`
- Enforces unique name+category constraint, deletion guard (no delete if inventory > 0)

#### 3. SkuService
- `create(catalogItemId: string, data: CreateSkuDto, actorId: string): Promise<Sku>`
- `addBarcode(skuId: string, data: AddBarcodeDto, actorId: string): Promise<Barcode>`
- `removeBarcode(skuId: string, barcodeId: string, actorId: string): Promise<void>`
- `lookupByBarcode(value: string): Promise<{ sku: Sku; catalogItem: CatalogItem }>`
- Validates barcode format (EAN-13, UPC-A, Code 128), enforces limits (100 SKUs/item, 10 barcodes/SKU)

#### 4. WorkflowService
- `submitForReview(operationId: string, actorId: string): Promise<WarehouseOperation>`
- `approve(operationId: string, actorId: string): Promise<WarehouseOperation>`
- `reject(operationId: string, actorId: string, reason: string): Promise<WarehouseOperation>`
- `cancel(operationId: string, actorId: string): Promise<WarehouseOperation>`
- Enforces state machine transitions: Draft → Pending_Review → Approved/Rejected, creator cannot approve

#### 5. OperationService
- `createImport(data: CreateImportDto, actorId: string): Promise<WarehouseOperation>`
- `createExport(data: CreateExportDto, actorId: string): Promise<WarehouseOperation>`
- `update(id: string, data: UpdateOperationDto, actorId: string): Promise<WarehouseOperation>`
- `findAll(params: OperationListParams): Promise<PaginatedResponse<WarehouseOperation>>`
- Validates SKU existence, enforces line item limits (500 import, 200 export)

#### 6. InventoryService
- `getAll(params: InventoryListParams): Promise<PaginatedResponse<InventoryRecord>>`
- `getBySkuId(skuId: string): Promise<InventoryRecord>`
- `updateThreshold(skuId: string, threshold: number): Promise<InventoryRecord>`
- `applyImport(operation: WarehouseOperation): Promise<void>` (within transaction)
- `applyExport(operation: WarehouseOperation): Promise<void>` (within transaction, validates stock)
- Atomic updates via Prisma transactions, CHECK constraint `quantity >= 0`

#### 7. ProductFilterService
- `search(params: ProductSearchParams): Promise<PaginatedResponse<ProductSearchResult>>`
- `getTopExported(params: TopExportedParams): Promise<ProductSearchResult[]>`
- Full-text search via PostgreSQL tsvector/tsquery, multi-criteria AND filtering, stock status classification

#### 8. ReportService
- `generate(params: ReportParams): Promise<ReportData>`
- `exportPdf(reportData: ReportData): Promise<Buffer>`
- `exportCsv(reportData: ReportData): Promise<string>`
- Cache-first strategy (Redis + DB), background generation via BullMQ for heavy periods

#### 9. AnalyticsService
- `getMovingAverages(params: MovingAvgParams): Promise<MovingAverageData>`
- `getTopProducts(params: TopProductsParams): Promise<ProductRanking[]>`
- `getTurnoverRates(params: TurnoverParams): Promise<TurnoverData[]>`
- `getTrends(params: TrendParams): Promise<TrendData>`
- `getSeasonalPatterns(params: SeasonalParams): Promise<SeasonalData>`
- Validates minimum data requirements (90 days for trends)

#### 10. PredictionService
- `getForecast(skuId: string): Promise<ForecastData>`
- `getReorderAlerts(): Promise<ReorderAlert[]>`
- `refreshAll(): Promise<void>` (called by BullMQ worker)
- Holt-Winters exponential smoothing, confidence intervals (10th/50th/90th percentile)

#### 11. AuditService
- `log(entry: AuditEntry): Promise<void>`
- `query(params: AuditQueryParams): Promise<PaginatedResponse<AuditLog>>`
- Append-only, immutable (no update/delete), within same transaction as the operation

### Frontend Components

#### Layout
- `MainLayout` — Sidebar + header + content area
- `Sidebar` — Navigation links with active state
- `Header` — User info, logout, notifications

#### Pages
- `Dashboard` — Stats cards, recent activity, low stock alerts, quick actions
- `CatalogList` / `CatalogForm` / `CatalogDetail` — CRUD with SKU management
- `OperationList` / `CreateImport` / `CreateExport` / `OperationDetail` — Workflow UI
- `InventoryList` / `InventoryDetail` — Stock levels with threshold config
- `ProductSearch` — Multi-criteria filter panel
- `ReportDashboard` — Period selector, summary, export
- `AnalyticsDashboard` / `Predictions` — Charts and forecasts

### API Interface (REST)

Base URL: `/api/v1`

| Module | Endpoints |
|--------|-----------|
| Auth | POST `/auth/login`, POST `/auth/refresh`, POST `/auth/logout` |
| Catalog | GET/POST `/catalog-items`, GET/PUT/DELETE `/catalog-items/:id` |
| SKU | GET/POST `/catalog-items/:itemId/skus`, GET/PUT `/skus/:id`, POST `/skus/:id/barcodes`, DELETE `/skus/:skuId/barcodes/:barcodeId`, GET `/barcodes/lookup/:value` |
| Operations | GET/POST `/operations`, GET/PUT `/operations/:id`, POST `/operations/:id/submit`, POST `/operations/:id/approve`, POST `/operations/:id/reject`, POST `/operations/:id/cancel` |
| Inventory | GET `/inventory`, GET `/inventory/:skuId`, PUT `/inventory/:skuId/threshold` |
| Products | GET `/products/search`, GET `/products/top-exported` |
| Reports | GET `/reports`, GET `/reports/export/:format` |
| Analytics | GET `/analytics/moving-averages`, GET `/analytics/top-products`, GET `/analytics/turnover`, GET `/analytics/trends`, GET `/analytics/seasonal` |
| Predictions | GET `/predictions`, GET `/predictions/:skuId`, GET `/predictions/reorder-alerts` |
| Audit | GET `/audit-logs` |

## Data Models

### Core Entities (Prisma Schema)

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  role          UserRole  @default(WAREHOUSE_STAFF)
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  createdOperations  WarehouseOperation[] @relation("OperationCreator")
  approvedOperations WarehouseOperation[] @relation("OperationApprover")
  auditLogs          AuditLog[]
  @@map("users")
}

enum UserRole {
  ADMIN_WAREHOUSE
  WAREHOUSE_MANAGER
  WAREHOUSE_STAFF
  VIEWER
}

model CatalogItem {
  id            String    @id @default(uuid())
  name          String
  description   String?
  category      String
  unitOfMeasure String    @map("unit_of_measure")
  imageUrl      String?   @map("image_url")
  createdBy     String    @map("created_by")
  updatedBy     String?   @map("updated_by")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  skus          Sku[]
  @@unique([name, category])
  @@index([category])
  @@index([name])
  @@map("catalog_items")
}

model Sku {
  id            String    @id @default(uuid())
  catalogItemId String    @map("catalog_item_id")
  code          String    @unique
  size          String?
  color         String?
  weight        Decimal?  @db.Decimal(10, 2)
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  catalogItem   CatalogItem     @relation(fields: [catalogItemId], references: [id])
  barcodes      Barcode[]
  inventory     InventoryRecord?
  lineItems     OperationLineItem[]
  @@index([catalogItemId])
  @@index([code])
  @@map("skus")
}

model Barcode {
  id          String        @id @default(uuid())
  skuId       String        @map("sku_id")
  value       String        @unique
  format      BarcodeFormat
  createdAt   DateTime      @default(now()) @map("created_at")
  sku         Sku           @relation(fields: [skuId], references: [id])
  @@index([value])
  @@index([skuId])
  @@map("barcodes")
}

enum BarcodeFormat { EAN_13  UPC_A  CODE_128 }

model InventoryRecord {
  id                String    @id @default(uuid())
  skuId             String    @unique @map("sku_id")
  quantity          Int       @default(0)
  location          String?
  lowStockThreshold Int       @default(10) @map("low_stock_threshold")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  sku               Sku       @relation(fields: [skuId], references: [id])
  @@index([quantity])
  @@map("inventory_records")
}

model WarehouseOperation {
  id              String          @id @default(uuid())
  operationNumber String          @unique @map("operation_number")
  type            OperationType
  status          OperationStatus @default(DRAFT)
  createdById     String          @map("created_by_id")
  approvedById    String?         @map("approved_by_id")
  supplierRef     String?         @map("supplier_ref")
  expectedDate    DateTime?       @map("expected_date")
  destination     String?
  reason          ExportReason?
  revisesId       String?         @map("revises_id")
  rejectionReason String?         @map("rejection_reason")
  approvedAt      DateTime?       @map("approved_at")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  createdBy       User            @relation("OperationCreator", fields: [createdById], references: [id])
  approvedBy      User?           @relation("OperationApprover", fields: [approvedById], references: [id])
  lineItems       OperationLineItem[]
  statusLog       OperationStatusLog[]
  @@index([type])
  @@index([status])
  @@index([createdById])
  @@index([approvedAt])
  @@map("warehouse_operations")
}

enum OperationType { IMPORT  EXPORT }
enum OperationStatus { DRAFT  PENDING_REVIEW  APPROVED  REJECTED  CANCELLED }
enum ExportReason { SALE  TRANSFER  RETURN }

model OperationLineItem {
  id            String    @id @default(uuid())
  operationId   String    @map("operation_id")
  skuId         String    @map("sku_id")
  quantity      Int
  unitCost      Decimal?  @map("unit_cost") @db.Decimal(15, 2)
  unitPrice     Decimal?  @map("unit_price") @db.Decimal(15, 2)
  operation     WarehouseOperation @relation(fields: [operationId], references: [id])
  sku           Sku                @relation(fields: [skuId], references: [id])
  @@index([operationId])
  @@index([skuId])
  @@map("operation_line_items")
}

model OperationStatusLog {
  id            String          @id @default(uuid())
  operationId   String          @map("operation_id")
  fromStatus    OperationStatus @map("from_status")
  toStatus      OperationStatus @map("to_status")
  changedBy     String          @map("changed_by")
  reason        String?
  createdAt     DateTime        @default(now()) @map("created_at")
  operation     WarehouseOperation @relation(fields: [operationId], references: [id])
  @@index([operationId])
  @@map("operation_status_log")
}

model AuditLog {
  id            String             @id @default(uuid())
  entityType    String             @map("entity_type")
  entityId      String             @map("entity_id")
  operationType AuditOperationType @map("operation_type")
  actorId       String             @map("actor_id")
  beforeData    Json?              @map("before_data")
  afterData     Json?              @map("after_data")
  createdAt     DateTime           @default(now()) @map("created_at")
  actor         User               @relation(fields: [actorId], references: [id])
  @@index([entityType, entityId])
  @@index([actorId])
  @@index([createdAt])
  @@map("audit_logs")
}

enum AuditOperationType { CREATE  UPDATE  DELETE }

model ReportCache {
  id          String    @id @default(uuid())
  periodType  String    @map("period_type")
  startDate   DateTime  @map("start_date")
  endDate     DateTime  @map("end_date")
  reportData  Json      @map("report_data")
  generatedAt DateTime  @map("generated_at")
  expiresAt   DateTime? @map("expires_at")
  @@unique([periodType, startDate, endDate])
  @@index([periodType])
  @@map("report_cache")
}

model Prediction {
  id              String    @id @default(uuid())
  skuId           String    @map("sku_id")
  forecastDate    DateTime  @map("forecast_date")
  predictedQty    Int       @map("predicted_qty")
  lowEstimate     Int       @map("low_estimate")
  highEstimate    Int       @map("high_estimate")
  methodology     String
  dataStartDate   DateTime  @map("data_start_date")
  dataEndDate     DateTime  @map("data_end_date")
  generatedAt     DateTime  @map("generated_at")
  @@index([skuId, forecastDate])
  @@map("predictions")
}
```

### Key TypeScript Interfaces

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CatalogListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}

interface OperationListParams {
  page?: number;
  pageSize?: number;
  type?: OperationType;
  status?: OperationStatus;
}

interface ProductSearchParams {
  query?: string;
  category?: string;
  skuCode?: string;
  barcode?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  sortBy?: 'name' | 'quantity' | 'category' | 'updatedAt' | 'exportVolume';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface ReportParams {
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
}

interface ReportData {
  period: { type: string; start: Date; end: Date };
  totalImports: number;
  totalExports: number;
  netInventoryChange: number;
  topProducts: { skuCode: string; name: string; totalMoved: number }[];
  financialSummary?: { totalImportCost: number; totalExportRevenue: number };
}

interface ForecastData {
  skuId: string;
  dailyForecasts: { date: Date; predicted: number; low: number; high: number }[];
  methodology: string;
  dataRange: { start: Date; end: Date };
  generatedAt: Date;
}

interface ReorderAlert {
  skuId: string;
  skuCode: string;
  productName: string;
  currentStock: number;
  pendingImports: number;
  forecastedDemand: number;
  recommendedReorder: number;
  leadTimeDays: number;
}
```

## Correctness Properties

### Property 1: Inventory Non-Negativity
Inventory quantity can never go below zero. Enforced by database CHECK constraint and application-level validation before export approval.
**Validates: Requirements 6.4, 4.5**

### Property 2: Workflow Integrity
Operations can only transition through valid states (Draft → Pending_Review → Approved/Rejected). No state can be skipped.
**Validates: Requirements 5.1, 5.2**

### Property 3: Self-Approval Prevention
The creator of an operation cannot approve their own operation.
**Validates: Requirements 5.3**

### Property 4: Atomic Inventory Updates
All line item inventory changes for a single operation approval happen within one database transaction — either all succeed or all roll back.
**Validates: Requirements 3.4, 3.5, 4.4, 12.3**

### Property 5: Audit Immutability
Audit log entries cannot be modified or deleted after creation. Enforced at both application and database levels.
**Validates: Requirements 12.5, 12.6**

### Property 6: Unique Constraints
SKU codes and barcode values are globally unique. Catalog item names are unique within their category.
**Validates: Requirements 1.2, 2.2, 2.6**

### Property 7: Data Consistency
Report metrics only include Approved operations. Predictions only use Approved export data.
**Validates: Requirements 8.5, 9.9, 10.1**

## Error Handling

| Error Type | HTTP Status | Response Format |
|-----------|-------------|-----------------|
| ValidationError | 400 | `{ error: 'VALIDATION_ERROR', message: string, details: FieldError[] }` |
| UnauthorizedError | 401 | `{ error: 'UNAUTHORIZED', message: 'Invalid credentials' }` |
| ForbiddenError | 403 | `{ error: 'FORBIDDEN', message: 'Insufficient permissions' }` |
| NotFoundError | 404 | `{ error: 'NOT_FOUND', message: string }` |
| ConflictError | 409 | `{ error: 'CONFLICT', message: string }` |
| RateLimitError | 429 | `{ error: 'RATE_LIMITED', message: string, retryAfter: number }` |
| InternalError | 500 | `{ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }` |

Rules:
- Production: No stack traces, no database details, no internal paths
- All errors logged with Pino (including stack trace internally)
- Validation errors include per-field details
- Rate limit responses include `Retry-After` header

## Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit tests | Vitest | Services, validators, utilities — 80%+ |
| Integration tests | Vitest + Prisma test DB | Repository + service + DB interactions |
| API tests | Vitest + supertest | Controller endpoints with auth |
| E2E tests | Playwright | Critical workflows (import/export/approval) |

Key test scenarios:
- Workflow state machine: all valid and invalid transitions
- Inventory atomicity: concurrent approval attempts
- Barcode validation: valid/invalid formats for each type
- Report caching: cache hit, cache miss, cache invalidation
- Prediction: insufficient data handling, forecast accuracy bounds
- Auth: token expiry, refresh flow, rate limiting
