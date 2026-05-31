# Loan Origination System — Technical Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (React + Vite)                         │
│  Login │ Dashboard │ Cases │ Applications │ Decision Designer │ Reports  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ REST API (JSON)
┌────────────────────────────────┴────────────────────────────────────────┐
│                    API Gateway (Express.js + Node.js 20)                  │
│  Auth │ Rate Limit │ Validation (Zod) │ CORS │ Helmet │ Pino Logging    │
├─────────────────────────────────────────────────────────────────────────┤
│                         Domain Services Layer                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│ │Pre-Screen│ │Workflow  │ │Decision  │ │Document  │ │Open Banking  │  │
│ │Engine    │ │Engine    │ │Engine    │ │Manager   │ │Service       │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│ │Customer  │ │Product   │ │Compliance│ │Reporting │ │Disbursement  │  │
│ │Service   │ │Catalog   │ │Engine    │ │Service   │ │Service       │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                       Infrastructure Layer                                │
│  PostgreSQL 16 │ Redis 7 │ BullMQ │ S3 (Documents) │ External APIs     │
└─────────────────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Pre-Screening Engine

Provides instant eligibility assessment before full application submission.

```typescript
interface PreScreeningRequest {
  productId: string;
  applicantData: {
    age?: number;
    monthlyIncome?: number;
    employmentStatus?: string;
    existingDebt?: number;
  };
  consentForBureauCheck: boolean;
  consentForOpenBanking: boolean;
}

interface PreScreeningResult {
  eligible: boolean;
  score: number; // 0-100
  maxEligibleAmount: number;
  indicativeRate: number;
  reasons: string[];
  dataSourcesUsed: ('bureau' | 'openBanking' | 'internal')[];
  validUntil: Date; // Pre-qualification expiry
}
```

Flow: Applicant submits minimal data → System pulls bureau (soft check) + Open Banking → Runs eligibility rules → Returns instant result.

### 2. Workflow Orchestration Engine

Low-code engine that executes configurable process definitions.

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  version: number;
  productType: ProductType;
  stages: StageDefinition[];
  transitions: TransitionRule[];
  triggers: WorkflowTrigger[];
}

interface StageDefinition {
  id: string;
  name: string;
  type: 'manual' | 'automated' | 'hybrid';
  tasks: TaskTemplate[];
  entryCriteria: Condition[];
  exitCriteria: Condition[];
  slaHours: number;
  escalationPolicy: EscalationPolicy;
  assignmentStrategy: AssignmentStrategy;
}

interface TransitionRule {
  from: string;
  to: string;
  condition: Condition;
  actions: TransitionAction[]; // e.g., send notification, create document
}

interface WorkflowTrigger {
  event: 'stage_enter' | 'stage_exit' | 'task_complete' | 'sla_breach' | 'data_change';
  condition?: Condition;
  action: 'create_document' | 'send_notification' | 'call_api' | 'update_field';
  config: Record<string, unknown>;
}
```

### 3. Visual Decision Engine (CRIF StrategyOne-inspired)

No-code strategy designer with what-if simulation.

```typescript
interface DecisionStrategy {
  id: string;
  name: string;
  version: number;
  status: 'draft' | 'testing' | 'champion' | 'challenger' | 'retired';
  nodes: DecisionNode[];
  connections: NodeConnection[];
  inputSchema: Record<string, FieldType>;
  outputSchema: Record<string, FieldType>;
}

interface DecisionNode {
  id: string;
  type: 'rule' | 'scorecard' | 'decision_table' | 'ml_model' | 'sub_strategy' | 'split' | 'merge';
  position: { x: number; y: number };
  config: RuleConfig | ScorecardConfig | DecisionTableConfig | MLModelConfig;
}

interface ScorecardConfig {
  name: string;
  characteristics: Array<{
    field: string;
    bins: Array<{ range: [number, number] | string[]; points: number }>;
    weight: number;
  }>;
  cutoffs: { approve: number; refer: number; reject: number };
}

interface WhatIfSimulation {
  strategyId: string;
  sampleSize: number;
  datasetId: string; // Historical applications to replay
  results: {
    approvalRate: number;
    rejectionRate: number;
    referralRate: number;
    expectedLossRate: number;
    revenueImpact: number;
    comparedTo?: string; // Champion strategy ID
  };
}

interface ChampionChallenger {
  championId: string;
  challengerId: string;
  trafficSplit: number; // 0-100, percentage to challenger
  startDate: Date;
  endDate?: Date;
  metrics: {
    champion: StrategyMetrics;
    challenger: StrategyMetrics;
  };
}
```

### 4. Open Banking Service

Transaction categorization and affordability analysis.

```typescript
interface OpenBankingConnection {
  id: string;
  customerId: string;
  provider: string; // Bank name
  consentId: string;
  consentExpiry: Date;
  accounts: BankAccount[];
}

interface TransactionCategory {
  code: string;
  name: string;
  parent?: string;
  type: 'income' | 'expense' | 'transfer' | 'other';
}

interface AffordabilityAssessment {
  customerId: string;
  period: { from: Date; to: Date };
  income: {
    salary: number;
    otherRegular: number;
    irregular: number;
    total: number;
  };
  expenses: {
    housing: number;
    utilities: number;
    transport: number;
    food: number;
    debt_repayments: number;
    other: number;
    total: number;
  };
  disposableIncome: number;
  affordableMonthlyPayment: number; // Max new payment capacity
  stabilityScore: number; // Income stability 0-100
  riskIndicators: string[]; // e.g., "gambling transactions", "payday loans"
}
```

### 5. ESG Scoring Module

```typescript
interface EsgScore {
  overall: number; // 0-100
  environmental: number;
  social: number;
  governance: number;
  factors: EsgFactor[];
  pricingAdjustment: number; // basis points adjustment to rate
}

interface EsgFactor {
  category: 'E' | 'S' | 'G';
  name: string;
  score: number;
  weight: number;
  source: string;
}
```

## Database Schema Extensions

Key new tables beyond Phase 1:

```sql
-- Decision Strategy (visual designer)
decision_strategies: id, name, version, status, nodes_json, connections_json, 
                     input_schema, output_schema, created_by, created_at

-- Champion-Challenger
champion_challengers: id, champion_id, challenger_id, traffic_split, 
                      start_date, end_date, status, metrics_json

-- What-If Simulations
simulations: id, strategy_id, dataset_id, sample_size, results_json, 
             created_by, created_at

-- Open Banking
open_banking_connections: id, customer_id, provider, consent_id, 
                          consent_expiry, status, created_at
bank_accounts: id, connection_id, account_number, type, currency, balance
transactions: id, account_id, date, amount, description, category_code, 
              merchant, is_recurring
affordability_assessments: id, customer_id, application_id, period_from, 
                           period_to, income_json, expenses_json, 
                           disposable_income, created_at

-- ESG
esg_scores: id, customer_id, application_id, overall, environmental, 
            social, governance, factors_json, pricing_adjustment, created_at

-- Workflow Definitions (low-code)
workflow_definitions: id, name, version, product_type, stages_json, 
                      transitions_json, triggers_json, is_active, created_at
workflow_instances: id, definition_id, case_id, current_stage, 
                    variables_json, started_at, completed_at
```

## API Design (New Endpoints)

### Pre-Screening
```
POST   /api/v1/pre-screening/check          — Run pre-screening
GET    /api/v1/pre-screening/:id/result      — Get pre-screening result
```

### Decision Engine (Visual)
```
POST   /api/v1/strategies                    — Create strategy
GET    /api/v1/strategies                    — List strategies
GET    /api/v1/strategies/:id               — Get strategy with nodes
PUT    /api/v1/strategies/:id               — Update strategy
POST   /api/v1/strategies/:id/deploy        — Deploy to production
POST   /api/v1/strategies/:id/simulate      — Run what-if simulation
POST   /api/v1/strategies/champion-challenger — Set up A/B test
GET    /api/v1/strategies/champion-challenger/:id/results — Get test results
```

### Open Banking
```
POST   /api/v1/open-banking/connect         — Initiate bank connection
GET    /api/v1/open-banking/:customerId/accounts — List connected accounts
GET    /api/v1/open-banking/:customerId/transactions — Get categorized transactions
POST   /api/v1/open-banking/:customerId/affordability — Run affordability assessment
```

### Workflow Designer
```
POST   /api/v1/workflows                    — Create workflow definition
GET    /api/v1/workflows                    — List workflow definitions
PUT    /api/v1/workflows/:id               — Update workflow
POST   /api/v1/workflows/:id/activate      — Activate workflow version
GET    /api/v1/workflows/monitor            — Live process monitoring
```

### Disbursement
```
POST   /api/v1/disbursements/initiate       — Initiate disbursement
GET    /api/v1/disbursements/:id/status     — Check disbursement status
POST   /api/v1/disbursements/:id/confirm    — Confirm disbursement
```

## Frontend Component Architecture

```
src/components/
├── decision-designer/          # Visual strategy builder
│   ├── StrategyCanvas.tsx      # Drag-and-drop node editor
│   ├── NodePalette.tsx         # Available node types
│   ├── RuleNodeEditor.tsx      # Rule configuration panel
│   ├── ScorecardEditor.tsx     # Scorecard builder
│   ├── SimulationPanel.tsx     # What-if results
│   └── ChampionChallengerView.tsx
├── open-banking/
│   ├── BankConnectionFlow.tsx  # OAuth consent flow
│   ├── TransactionView.tsx     # Categorized transactions
│   └── AffordabilityReport.tsx # Income/expense breakdown
├── workflow-designer/
│   ├── WorkflowCanvas.tsx      # Visual workflow editor
│   ├── StageNode.tsx           # Stage configuration
│   ├── TransitionEditor.tsx    # Transition rules
│   └── ProcessMonitor.tsx      # Live monitoring
├── pre-screening/
│   ├── PreScreeningForm.tsx    # Quick eligibility check
│   └── EligibilityResult.tsx   # Instant result display
└── disbursement/
    ├── DisbursementView.tsx    # Disbursement status
    └── FundTransferConfirm.tsx # Confirmation step
```

## Security Considerations

- Open Banking tokens stored encrypted (AES-256-GCM) with short TTL
- Decision strategy changes require approval workflow (four-eyes)
- ESG data anonymized in non-production environments
- All bureau/Open Banking calls logged for audit (without PII in logs)
- Champion-challenger traffic routing uses deterministic hashing (reproducible)

## Performance Targets

| Operation | Target | Approach |
|-----------|--------|----------|
| Pre-screening | < 3s | Parallel bureau + OB calls, cached rules |
| Decision execution | < 500ms | In-memory rule engine, Redis-cached strategies |
| What-if simulation (1000 apps) | < 30s | BullMQ worker, batch processing |
| Open Banking categorization | < 2s | Pre-trained model, batch categorize |
| Workflow transition | < 200ms | Event-driven, async side effects |
| Dashboard load | < 2s | Cached aggregates, incremental updates |
