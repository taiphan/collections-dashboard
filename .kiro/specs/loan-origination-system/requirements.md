# Loan Origination System (LOS) — Requirements v2.0

## Overview

Build an enterprise-grade **Digital Experience Platform for Lending** inspired by CRIF Digital's full customer lifecycle ecosystem and Pega Constellation 8.24.1.3. The platform covers the complete lending journey: **New Customer Acquisition → Digital Onboarding → Loan Origination → Customer Management → Collection** — unified by a GenAI-powered Decision Engine (StrategyOne-inspired), Open Banking Suite, and Process Orchestrator.

Version 2.0 expands beyond loan origination into a full-lifecycle lending platform with:
- **GenAI-integrated Decision Engine** (Agentic AI for autonomous multi-step tasks)
- **Digital Onboarding** (remote KYC, biometric verification, digital signature)
- **Customer Management** (early warning, portfolio monitoring, risk mitigation)
- **Collection Management** (AI-driven recovery strategies, self-cure models)
- **Real-time Credit** (instant decisioning, sub-second responses)
- **Anti-fraud / Anti-tampering** (deepfake detection, synthetic document detection)
- **Credit Passport** (SME credit score visibility and improvement tools)

Target KPIs (aligned with CRIF benchmarks):
- 4x ROI within 12 months
- +300% volume of applications processed
- 55% savings in underwriting capacity
- -50% time-to-cash
- +100% increase in automated approvals
- Real-time credit decisions (< 15 seconds end-to-end)
- 90%+ transaction categorization accuracy (GenAI-enhanced)
- 30% reduction in manual processing via Open Banking automation

---

## Platform Modules (CRIF Digital Ecosystem)

| Module | Description | Version |
|--------|-------------|---------|
| New Customer Acquisition | Lead scoring, targeting, pre-qualification | v2.0 |
| Digital Onboarding | Remote KYC, biometric, e-signature, anti-fraud | v2.0 |
| Loan Origination | Pre-screening → Disbursement (core) | v1.0 ✅ |
| Customer Management | Portfolio monitoring, early warning, risk mitigation | v2.0 |
| Collection | AI-driven recovery, self-cure, agency management | v2.0 |
| Decision Engine (StrategyOne) | Visual strategy designer, GenAI copilot, augmented intelligence, cross-lifecycle | v2.0 ⬆ |
| Open Banking Suite | Transaction categorization, affordability, account aggregation | v1.0 ✅ |
| Process Orchestrator (CFF) | Cloud-native omnichannel orchestration, white-label, multi-tenant | v2.0 ⬆ |
| ESG Data & Analytics | Physical/transition risk, GHG emissions, regulatory alignment, climate scenarios | v2.0 ⬆ |
| Advanced Analytics | ML models, model governance, predictive risk, auto-retraining | v2.0 ⬆ |
| Digital Lending Platform | White-label end-to-end lending, prebuilt journeys, sandbox | v2.0 |
| Credit Passport | SME credit score visibility and improvement | v2.0 |
| Anti-Fraud Engine | Deepfake detection, synthetic document detection, GenAI defense | v2.0 |

---

## Functional Requirements

### FR-1: Pre-Screening & Application Intake

- **FR-1.1**: Multi-channel application submission (web portal, mobile-responsive, branch/agent-assisted, API for partners)
- **FR-1.2**: Dynamic form rendering based on loan product type (personal, mortgage, auto, SME, commercial, BNPL)
- **FR-1.3**: Automated pre-screening engine with instant eligibility check before full application
- **FR-1.4**: Automatic data retrieval from credit bureaus and Open Banking during pre-screening
- **FR-1.5**: KYC/AML verification integrated into pre-screening (identity, sanctions, PEP checks)
- **FR-1.6**: Save & resume capability for incomplete applications
- **FR-1.7**: Co-applicant and guarantor support with linked assessments
- **FR-1.8**: Digital identity verification with document upload and liveness detection
- **FR-1.9**: Real-time field validation with Zod schemas
- **FR-1.10**: Application deduplication detection (fuzzy matching on name, ID, phone)
- **FR-1.11**: Pre-qualification score displayed to applicant in real-time (soft check, no bureau impact)
- **FR-1.12**: Configurable pre-screening rules per product (minimum criteria before full submission)

### FR-2: Workflow Orchestration Engine (Low-Code/No-Code)

- **FR-2.1**: Configurable case lifecycle (stages: Pre-Screening → Intake → Verification → Underwriting → Decision → Documentation → Disbursement → Closure)
- **FR-2.2**: Low-code/no-code process orchestration via visual workflow designer (drag-and-drop)
- **FR-2.3**: Stage-gate model with configurable entry/exit criteria per stage
- **FR-2.4**: Parallel and sequential task orchestration within stages
- **FR-2.5**: Auto-assignment rules (round-robin, skill-based, workload-based, product-based)
- **FR-2.6**: SLA tracking per stage with escalation rules (warning → escalate → breach)
- **FR-2.7**: Case splitting (e.g., separate sub-cases for collateral evaluation)
- **FR-2.8**: Case merging for related applications
- **FR-2.9**: Full audit trail for all case state transitions (tamper-proof)
- **FR-2.10**: Manual override with approval hierarchy and four-eyes principle
- **FR-2.11**: Configurable workflow templates per product type
- **FR-2.12**: Dynamic web interfaces generated from workflow context (form fields adapt per stage)
- **FR-2.13**: Live document creation triggered by workflow events
- **FR-2.14**: Process governance dashboard with real-time monitoring of all active workflows
- **FR-2.15**: Easy integration with external data sources and back-end systems via connector framework
- **FR-2.16**: Workflow versioning with rollback capability

### FR-3: Decision Engine (Visual Strategy Designer)

- **FR-3.1**: Visual no-code decision strategy designer (graphic rule builder for business users)
- **FR-3.2**: Configurable decision rule sets with priority-based execution
- **FR-3.3**: Credit scoring integration (bureau pull: Experian, TransUnion, Equifax, local bureaus)
- **FR-3.4**: Automated decisioning for straight-through processing (STP) — target 100% increase in auto-approvals
- **FR-3.5**: Decision matrix with weighted scoring models (configurable scorecards)
- **FR-3.6**: Policy rules (eligibility, exposure limits, concentration limits, product-specific)
- **FR-3.7**: What-if analysis and simulation tools (evaluate strategy impact before deployment)
- **FR-3.8**: Champion-challenger testing (A/B test decision strategies in production)
- **FR-3.9**: Exception handling with deviation approval workflows
- **FR-3.10**: Decision audit log with full traceability and explainability
- **FR-3.11**: Debt-to-income (DTI), loan-to-value (LTV), debt-service-coverage-ratio (DSCR) auto-calculation
- **FR-3.12**: Risk grading and pricing tier assignment (risk-based pricing)
- **FR-3.13**: Financial statement analysis module (balance sheet, P&L parsing for SME/commercial)
- **FR-3.14**: ESG sustainability scoring integrated into credit decisions
- **FR-3.15**: Tailor-made and expert scoring models (configurable without IT involvement)
- **FR-3.16**: Authorization matrices for multi-level approval (amount-based, risk-based)
- **FR-3.17**: Built-in machine learning model integration for continuous optimization
- **FR-3.18**: Real-time strategy deployment without system restart
- **FR-3.19**: Pricing models and simulators configurable in decision engine
- **FR-3.20**: Credit policy rules updatable directly by business users
- **FR-3.21**: Augmented intelligence — AI-assisted strategy recommendations based on portfolio performance
- **FR-3.22**: Target identification — identify optimal customer segments for each product
- **FR-3.23**: Customer loyalty scoring — predict churn risk and recommend retention actions
- **FR-3.24**: Regulatory policy implementation — encode regulatory rules as executable strategies
- **FR-3.25**: Cross-lifecycle decisioning — single engine covering origination, pricing, portfolio management, fraud detection, early warning, and collection
- **FR-3.26**: GenAI copilot for strategy design — natural language to decision logic conversion
- **FR-3.27**: Automatic audit documentation generation from strategy execution

### FR-4: Document Management

- **FR-4.1**: Document checklist generation based on product/applicant profile
- **FR-4.2**: Document upload with type/size validation (paperless process)
- **FR-4.3**: OCR integration for document data extraction (income proof, ID, statements)
- **FR-4.4**: Document verification workflow (manual + automated)
- **FR-4.5**: Document versioning and expiry tracking
- **FR-4.6**: E-signature integration (DocuSign/Adobe Sign compatible)
- **FR-4.7**: Template-based document generation (offer letters, agreements, disclosures)
- **FR-4.8**: Secure document storage with encryption at rest
- **FR-4.9**: Live document creation triggered by workflow events (auto-generate at stage transitions)
- **FR-4.10**: Embedded document management enabling fully paperless disbursement

### FR-5: Product Catalog & Pricing

- **FR-5.1**: Configurable loan product definitions (type, tenure, limits, eligibility)
- **FR-5.2**: Interest rate management (fixed, variable, hybrid, promotional)
- **FR-5.3**: Fee structure configuration (origination, processing, late payment)
- **FR-5.4**: Pricing rules engine (risk-based pricing, relationship pricing)
- **FR-5.5**: Product bundling and cross-sell recommendations
- **FR-5.6**: Product versioning with effective date management
- **FR-5.7**: Amortization schedule generation (multiple methods: annuity, linear, bullet)
- **FR-5.8**: Pricing simulators accessible from decision engine (what-if on rates/fees)
- **FR-5.9**: Sustainability-linked pricing (ESG-adjusted rates)

### FR-6: Customer & Relationship Management

- **FR-6.1**: 360-degree customer view (demographics, financials, relationships, history, Open Banking data)
- **FR-6.2**: Customer search with fuzzy matching
- **FR-6.3**: Relationship hierarchy (individual → household → corporate group)
- **FR-6.4**: KYC/AML/KYB screening integration (automated at onboarding)
- **FR-6.5**: Customer risk profiling with continuous monitoring
- **FR-6.6**: Communication history (emails, SMS, calls, notifications)
- **FR-6.7**: Consent management (GDPR, CCPA compliance)
- **FR-6.8**: Open Banking account aggregation (view all accounts across institutions)
- **FR-6.9**: Transaction categorization and spending behavior profiling
- **FR-6.10**: Customer affordability assessment from Open Banking data

### FR-7: Open Banking & Data Enrichment

- **FR-7.1**: PSD2/Open Banking API integration for account access (with customer consent)
- **FR-7.2**: Transaction categorization engine (90%+ accuracy target, GenAI-enhanced)
- **FR-7.3**: Income verification from bank transaction data (automated)
- **FR-7.4**: Expense categorization and affordability calculation
- **FR-7.5**: Cash flow analysis and pattern detection
- **FR-7.6**: Account aggregation across multiple banks
- **FR-7.7**: Real-time balance and transaction monitoring (for ongoing risk)
- **FR-7.8**: Alternative data scoring for thin-file applicants
- **FR-7.9**: Configurable data enrichment pipeline (plug in additional data providers)

### FR-8: Compliance & Regulatory

- **FR-8.1**: Configurable compliance rule engine
- **FR-8.2**: Regulatory reporting (HMDA, CRA, TILA, RESPA equivalents, local regulations)
- **FR-8.3**: Anti-money laundering (AML) checks with automated screening
- **FR-8.4**: Sanctions screening (OFAC, PEP, EU sanctions lists)
- **FR-8.5**: Fair lending analysis and monitoring
- **FR-8.6**: Disclosure management and delivery tracking
- **FR-8.7**: Regulatory change management workflow
- **FR-8.8**: Compliance audit trail with tamper-proof logging
- **FR-8.9**: Automatic audit documentation generation from decision engine
- **FR-8.10**: Full decision explainability for regulatory inquiries
- **FR-8.11**: Standardized processes ensuring compliance across organization

### FR-9: Integration Hub

- **FR-9.1**: Credit bureau integration (pull/push, multiple providers)
- **FR-9.2**: Core banking system integration (account creation, disbursement)
- **FR-9.3**: Payment gateway integration
- **FR-9.4**: Identity verification services (eKYC/eKYB providers)
- **FR-9.5**: Property valuation / collateral management APIs
- **FR-9.6**: Insurance provider integration
- **FR-9.7**: Government database verification (tax, employment, company registry)
- **FR-9.8**: Webhook-based event notification system
- **FR-9.9**: API gateway with rate limiting and versioning
- **FR-9.10**: Open Banking API connectors (PSD2, account information, payment initiation)
- **FR-9.11**: ESG data provider integration (sustainability ratings)
- **FR-9.12**: Financial statement parsing services (OCR + structured extraction)
- **FR-9.13**: Connector framework for easy addition of new data sources

### FR-10: User Interface (Constellation-Style)

- **FR-10.1**: Role-based dashboards (loan officer, underwriter, manager, admin, compliance)
- **FR-10.2**: Work queue management with filtering and prioritization
- **FR-10.3**: Guided workflow UI (step-by-step case processing)
- **FR-10.4**: Dynamic form rendering based on case context and workflow stage
- **FR-10.5**: Real-time notifications and alerts
- **FR-10.6**: Inline case collaboration (comments, mentions, attachments)
- **FR-10.7**: Responsive design (desktop-first, mobile-compatible)
- **FR-10.8**: Accessibility compliance (WCAG 2.1 AA)
- **FR-10.9**: Theme customization and white-labeling
- **FR-10.10**: Keyboard shortcuts for power users
- **FR-10.11**: Visual decision strategy designer UI (drag-and-drop rule builder)
- **FR-10.12**: What-if simulation interface with scenario comparison
- **FR-10.13**: Process monitoring dashboard (live view of all active cases and bottlenecks)

### FR-11: Reporting & Analytics

- **FR-11.1**: Pipeline dashboard (applications by stage, volume, conversion)
- **FR-11.2**: TAT (turnaround time) analytics per stage — target decisions within 15 minutes
- **FR-11.3**: Loan officer performance metrics
- **FR-11.4**: Portfolio risk distribution reports
- **FR-11.5**: Compliance reporting (regulatory submissions)
- **FR-11.6**: Custom report builder with export (CSV, PDF)
- **FR-11.7**: Real-time KPI widgets (approval rate, avg processing time, SLA breach %, auto-approval rate)
- **FR-11.8**: Trend analysis and forecasting
- **FR-11.9**: Decision engine performance metrics (strategy effectiveness, score distribution)
- **FR-11.10**: Champion-challenger results comparison dashboard
- **FR-11.11**: Time-to-yes and time-to-cash tracking
- **FR-11.12**: Underwriting capacity utilization metrics

### FR-12: Disbursement & Post-Approval

- **FR-12.1**: Seamless integration with back-end banking systems for fund transfer
- **FR-12.2**: Collateral value integration into disbursement workflow
- **FR-12.3**: Holistic view combining risk profile, collateral, and loan application
- **FR-12.4**: Automated disbursement for STP-approved loans
- **FR-12.5**: Disbursement confirmation and notification to borrower
- **FR-12.6**: Post-disbursement document archival
- **FR-12.7**: Loan account creation in core banking system

---

## v2.0 Functional Requirements (New Modules)

### FR-13: Digital Onboarding (v2.0)

- **FR-13.1**: Remote digital onboarding flow (registration → verification → signature)
- **FR-13.2**: Biometric identity verification (face match, liveness detection)
- **FR-13.3**: Document OCR with anti-tampering detection (GenAI-powered)
- **FR-13.4**: Deepfake and synthetic document detection
- **FR-13.5**: Digital signature integration (qualified e-signature)
- **FR-13.6**: Video KYC for high-risk applicants
- **FR-13.7**: Multi-step onboarding wizard with progress persistence
- **FR-13.8**: Configurable onboarding flows per product/jurisdiction
- **FR-13.9**: Real-time ID document validation (passport, national ID, driver's license)
- **FR-13.10**: Consent collection and management (GDPR/CCPA)

### FR-14: Customer Management & Early Warning (v2.0)

- **FR-14.1**: Portfolio monitoring dashboard (all active loans per customer)
- **FR-14.2**: Early warning system with configurable triggers (payment delays, income drops)
- **FR-14.3**: Automated risk re-scoring on trigger events
- **FR-14.4**: Customer health score (composite of payment behavior, financial stability)
- **FR-14.5**: Proactive outreach automation (SMS/email on early warning)
- **FR-14.6**: Risk mitigation strategy assignment via Decision Engine
- **FR-14.7**: Customer segmentation for targeted actions
- **FR-14.8**: Relationship manager assignment and workload balancing
- **FR-14.9**: Cross-sell/up-sell opportunity detection
- **FR-14.10**: Customer lifecycle timeline view

### FR-15: Collection Management (v2.0)

- **FR-15.1**: Collection case creation from early warning triggers
- **FR-15.2**: AI-driven collection strategy assignment (soft → hard escalation)
- **FR-15.3**: Self-cure prediction model (identify customers likely to self-resolve)
- **FR-15.4**: Multi-channel contact strategy (SMS, email, call, letter)
- **FR-15.5**: Payment arrangement and restructuring workflow
- **FR-15.6**: Collection agency assignment and performance tracking
- **FR-15.7**: Recovery rate analytics and optimization
- **FR-15.8**: Configurable collection policies per segment/product
- **FR-15.9**: Legal action workflow (escalation to legal recovery)
- **FR-15.10**: Settlement and write-off management

### FR-16: New Customer Acquisition (v2.0)

- **FR-16.1**: Lead scoring engine (propensity to convert)
- **FR-16.2**: Pre-approved offer generation based on bureau data
- **FR-16.3**: Campaign management integration
- **FR-16.4**: Referral tracking and attribution
- **FR-16.5**: Landing page builder for product campaigns
- **FR-16.6**: A/B testing for acquisition strategies
- **FR-16.7**: Cost-per-acquisition tracking

### FR-17: GenAI Integration (v2.0)

- **FR-17.1**: Agentic AI for autonomous multi-step task execution
- **FR-17.2**: Natural language strategy creation ("Create a rule that rejects DTI > 50%")
- **FR-17.3**: AI-powered document summarization (financial statements, contracts)
- **FR-17.4**: Intelligent case routing based on complexity analysis
- **FR-17.5**: Automated compliance narrative generation
- **FR-17.6**: Conversational analytics (ask questions about portfolio in natural language)
- **FR-17.7**: GenAI-enhanced transaction categorization (90%+ accuracy)
- **FR-17.8**: Synthetic data generation for strategy testing

### FR-18: Credit Passport (v2.0)

- **FR-18.1**: SME credit score visibility dashboard
- **FR-18.2**: Score improvement recommendations
- **FR-18.3**: Financial health benchmarking against industry peers
- **FR-18.4**: Shareable credit profile for loan applications
- **FR-18.5**: Historical score trend tracking

### FR-19: ESG Data & Analytics (v2.0 Enhanced)

- **FR-19.1**: Physical risk assessment at counterparty level (flood, fire, earthquake exposure)
- **FR-19.2**: Transition risk scoring (carbon intensity, stranded asset risk)
- **FR-19.3**: GHG emissions estimation per borrower (Scope 1, 2, 3)
- **FR-19.4**: Granular ESG indicators at local unit level (not just company-wide)
- **FR-19.5**: Regulatory ESG alignment monitoring (EU Taxonomy, SFDR, CSRD)
- **FR-19.6**: ESG data enrichment from external providers (30k+ counterparties)
- **FR-19.7**: Portfolio-level ESG exposure dashboard
- **FR-19.8**: ESG-linked pricing engine (green discount, brown premium)
- **FR-19.9**: Climate scenario analysis (1.5°C, 2°C, 3°C pathways)
- **FR-19.10**: ESG advisory and training module for relationship managers

### FR-20: Process Orchestrator / CFF (v2.0 Enhanced)

- **FR-20.1**: Cloud-native, API-based process orchestration framework
- **FR-20.2**: Omnichannel orchestration (web, mobile, branch, API, partner channels)
- **FR-20.3**: Modular origination pipeline (pre-screening → underwriting → decision → disbursement as composable modules)
- **FR-20.4**: White-label capability — fully brandable for different institutions
- **FR-20.5**: Third-party integration marketplace (plug-in data providers, services)
- **FR-20.6**: Process versioning with zero-downtime deployment
- **FR-20.7**: Real-time process monitoring with bottleneck detection
- **FR-20.8**: Event-driven architecture with webhook notifications
- **FR-20.9**: Multi-tenant support with tenant-level configuration isolation
- **FR-20.10**: Sandbox environment for testing new process configurations

### FR-21: Advanced Analytics (v2.0 Enhanced)

- **FR-21.1**: ML-based credit scoring models (gradient boosting, neural networks)
- **FR-21.2**: Open Banking data enrichment for model training
- **FR-21.3**: Automated model retraining pipeline (detect drift, retrain, validate)
- **FR-21.4**: Model explainability (SHAP values, feature importance)
- **FR-21.5**: Regulatory-compliant model governance (model inventory, validation, approval)
- **FR-21.6**: ML-based credit policy design — reduce manual review area by 6%+
- **FR-21.7**: Predictive analytics for portfolio risk (early warning signals)
- **FR-21.8**: +15% more high-risk exposures managed in advance
- **FR-21.9**: Custom model development toolkit (Python/R integration)
- **FR-21.10**: A/B testing framework for model comparison in production

### FR-22: Digital Lending Platform (v2.0 Enhanced)

- **FR-22.1**: Cloud-native, API-based, white-label end-to-end lending platform
- **FR-22.2**: Prebuilt customer journeys for Individuals and SMEs
- **FR-22.3**: Self-service digital channels (fully automated, no human touch)
- **FR-22.4**: Assisted digital channels (agent-guided with digital tools)
- **FR-22.5**: Integrated Digital Onboarding + KYC/KYB + Open Banking + AI creditworthiness in one flow
- **FR-22.6**: Partner/broker portal with white-label embedding
- **FR-22.7**: Sandbox environment for client testing and demo
- **FR-22.8**: +15% new first-time digital clients target
- **FR-22.9**: Multi-product support (consumer loans, SME loans, mortgages, BNPL, credit lines)
- **FR-22.10**: Collaboration workflow for all actors (applicant, broker, underwriter, compliance)

### FR-23: Decision Engine for Collection & Recovery (v2.0)

> Inspired by [CRIF Decision Engine for Collection](https://www.crif.digital/use-cases/decision-engine-for-collection/) — an advanced decisioning solution managing all decision-making touchpoints across the end-to-end collection process.

**Key Aims:**
- Increase recovery rate (+14% benchmark)
- Optimize recovery costs (reduce OPEX per recovered amount)
- Roll rate improvement (fewer cases rolling into default)
- FTE efficiencies (increased automation, reduced collector involvement)
- Constant policy review (staff allocation, budget execution, process optimization)
- Tailored debtor approach (personalized with less human interaction)

#### FR-23.1: Data Enrichment & Validation for Collection

> Ref: [CRIF Collection Data Enrichment & Validation](https://www.crif.digital/use-cases/collection-data-enrichment/) — Updated, enriched, and verified data is key to improving collection performance. Solutions retrieve internal data, enrich with external sources, and perform data quality validation checks stored in an ad-hoc data model.

**Pain Points Addressed:** Enrichment with updated external information, data quality & validation

- **FR-23.1.1**: Automated portfolio data enrichment at case creation (demographics, contact info, financial profile)
- **FR-23.1.2**: Real-time data validation against external sources (address, phone, employment)
- **FR-23.1.3**: Skip tracing integration for unreachable debtors (locate updated contact information)
- **FR-23.1.4**: Bureau data refresh at configurable intervals during collection lifecycle
- **FR-23.1.5**: Open Banking data pull (with consent) for affordability reassessment
- **FR-23.1.6**: Data quality scoring per debtor record (completeness, recency, accuracy)
- **FR-23.1.7**: External data integration hub — Credit Bureau, Business Intelligence, Open Banking connectors
- **FR-23.1.8**: Ad-hoc collection data model — dedicated schema for enriched portfolio storage with validation rules
- **FR-23.1.9**: Internal data retrieval pipeline — aggregate data from core banking, CRM, and loan origination systems
- **FR-23.1.10**: Data validation engine — automated checks on enriched data (format, consistency, freshness)
- **FR-23.1.11**: Portfolio enrichment batch processing — scheduled bulk enrichment for entire delinquent portfolio
- **FR-23.1.12**: Enrichment audit trail — track which data sources contributed to each debtor profile update

#### FR-23.2: Customer Segmentation & Collection Scoring

> Ref: [CRIF Collection Customer Segmentation & Scoring](https://www.crif.digital/use-cases/collection-customer-segmentation-and-scoring/) — Segmentation and scoring models direct each segment toward the optimal course of action. Scoring and strategy can be designed and modified by business users via a flexible graphic designer deployed autonomously without IT intervention.

**Pain Points Addressed:** Customized predictive scoring, best practice segmentation, business user autonomy & flexibility in strategy design and updating

- **FR-23.2.1**: Advanced analytics-driven portfolio segmentation into granular clusters with same "persona" profile
- **FR-23.2.2**: Collection scoring models (propensity to pay, self-cure probability, optimal channel)
- **FR-23.2.3**: Self-cure prediction model — identify customers likely to resolve without intervention
- **FR-23.2.4**: Roll rate prediction model — estimate probability of rolling into next delinquency bucket
- **FR-23.2.5**: Collection amount estimation model — predict recoverable amount per segment
- **FR-23.2.6**: Behavioral segmentation based on past repayment performance and debtor profile
- **FR-23.2.7**: Dynamic re-segmentation as new data arrives or debtor behavior changes
- **FR-23.2.8**: Configurable segmentation rules by business users via no-code graphical interface
- **FR-23.2.9**: Customized predictive scoring — tailor-made models per portfolio type (retail, SME, commercial)
- **FR-23.2.10**: Best practice segmentation templates — pre-built segmentation strategies based on industry benchmarks
- **FR-23.2.11**: Scoring model versioning — track model performance over time, compare versions, rollback
- **FR-23.2.12**: Segment-to-strategy mapping — each segment automatically routed to optimal collection action path
- **FR-23.2.13**: Business user scoring designer — non-technical users create/modify scoring rules via graphical UI
- **FR-23.2.14**: Scoring model backtesting — validate model accuracy against historical collection outcomes

#### FR-23.3: Collection Process Management

> Ref: [CRIF Collection Process Management](https://www.crif.digital/use-cases/collection-process-management/) — Workflow supports internal and external users in performing collection activities through automatic assignments with configurable logic. Mobile app helps field collectors optimize routes. Self-cure customers use a digital self-collection portal to define recovery plans.

**Pain Points Addressed:** Automatic workflow, insourcing vs outsourcing, workload balance, resource specialization, incentive systems

- **FR-23.3.1**: Visual no-code strategy designer for collection workflows (drag-and-drop rule builder)
- **FR-23.3.2**: Early collection strategy automation (soft reminders before escalation)
- **FR-23.3.3**: Contact strategy optimization — determine optimal timing, channel, and frequency per segment
- **FR-23.3.4**: Multi-channel orchestration (SMS, email, IVR, call, letter, push notification, WhatsApp)
- **FR-23.3.5**: Escalation path configuration (soft → medium → hard → legal → write-off)
- **FR-23.3.6**: Collection agency allocation strategy (insource vs outsource decision logic)
- **FR-23.3.7**: Restructuring & settlement strategy for late-stage delinquency
- **FR-23.3.8**: Recovery allocation strategies (Work / Place / Sell decision framework)
- **FR-23.3.9**: Strategy versioning with full change history and rollback capability
- **FR-23.3.10**: Business users can independently configure and modify strategies without IT intervention
- **FR-23.3.11**: Automatic case assignment — configurable logic (round-robin, skill-based, workload-balanced, product-based)
- **FR-23.3.12**: Outsourcer management — assign cases to external collection agencies, track performance, manage SLAs
- **FR-23.3.13**: CTI (Computer Telephony Integration) — click-to-call, call recording, disposition codes, call scripting
- **FR-23.3.14**: Digital self-collection portal — debtor-facing web portal for self-cure customers to view balances and define payment plans
- **FR-23.3.15**: Mobile app for field collectors — route optimization, visit logging, payment collection, offline capability
- **FR-23.3.16**: Workload balancing engine — distribute cases evenly across collectors based on capacity and specialization
- **FR-23.3.17**: Resource specialization routing — match case complexity/type to collector expertise (e.g., high-value, legal, SME)
- **FR-23.3.18**: Incentive system management — configure and track collector performance incentives (recovery targets, bonuses)
- **FR-23.3.19**: User front-end for collectors — unified workspace with case queue, debtor profile, action history, next-best-action
- **FR-23.3.20**: Automated workflow triggers — time-based, event-based, and outcome-based automatic progression through collection stages

#### FR-23.4: AI-Driven Optimization Module

- **FR-23.4.1**: Mathematical optimization for workforce capacity planning ("Do we have the right number of personnel?")
- **FR-23.4.2**: What-if capacity simulation ("If 10% more capacity, what's the financial impact?")
- **FR-23.4.3**: Workforce reduction impact analysis ("If we reduce by 5-10%, how does it affect results?")
- **FR-23.4.4**: Mid-cycle strategy re-optimization ("Halfway through month, not hitting targets — how to refocus?")
- **FR-23.4.5**: Constraint-based optimization (maximize recovery under budget/FTE constraints)
- **FR-23.4.6**: Machine learning model integration for continuous strategy improvement
- **FR-23.4.7**: Reinforcement learning for adaptive contact strategies (learn from outcomes)
- **FR-23.4.8**: Automated strategy recommendations based on portfolio performance trends

#### FR-23.5: Monitoring, Audit & Continuous Improvement

> Ref: [CRIF Collection Monitoring & Continuous Improvement](https://www.crif.digital/use-cases/collection-monitoring/) — Integrates a Business Intelligence & Reporting module for monitoring collection performance. The Strategy Optimizer identifies necessary modifications to continuously improve performance.

**Pain Points Addressed:** Performance measurement, champion-challenger trials, strategy optimization

- **FR-23.5.1**: Collection performance dashboard (recovery rate, cost-per-recovery, roll rates, FTE utilization)
- **FR-23.5.2**: Champion-challenger testing for collection strategies (A/B test in production)
- **FR-23.5.3**: Real-time KPI monitoring with configurable alerts on threshold breaches
- **FR-23.5.4**: Full audit tracking with versioning of all decision process changes
- **FR-23.5.5**: Automatic documentation generation for compliance and audit purposes
- **FR-23.5.6**: Version comparison tool — highlight differences between process versions
- **FR-23.5.7**: Peer review workflow (4-eyes / 6-eyes check) as precondition to strategy deployment
- **FR-23.5.8**: Strategy effectiveness reporting (which strategies yield highest recovery per segment)
- **FR-23.5.9**: Debtor outcome tracking (promise-to-pay fulfillment, payment plan adherence)
- **FR-23.5.10**: Continuous improvement loop — auto-suggest strategy adjustments based on outcome data
- **FR-23.5.11**: Embedded Business Intelligence & Reporting module — pre-built collection analytics without external BI tools
- **FR-23.5.12**: Strategy Optimizer — automated identification of strategy modifications needed to improve performance
- **FR-23.5.13**: Performance measurement framework — configurable KPIs per team, segment, product, and agency
- **FR-23.5.14**: Champion-challenger trial management — define test groups, control groups, duration, and success criteria
- **FR-23.5.15**: Strategy optimization recommendations — data-driven suggestions for policy adjustments based on trial outcomes

#### FR-23.6: Collection Decision Engine Integration

- **FR-23.6.1**: Seamless integration with core Decision Engine (FR-3) — shared rule authoring interface
- **FR-23.6.2**: Collection-specific decision nodes within the visual strategy designer
- **FR-23.6.3**: Real-time decisioning at each collection touchpoint (< 500ms response)
- **FR-23.6.4**: Event-driven triggers (payment received, promise broken, contact failed) feeding back into engine
- **FR-23.6.5**: Integration with Early Warning System (FR-14) for proactive collection initiation
- **FR-23.6.6**: API-first architecture for external system integration (core banking, payment gateways, agencies)
- **FR-23.6.7**: Batch decisioning for portfolio-level strategy reassignment (nightly/weekly runs)
- **FR-23.6.8**: Decision explainability — full traceability of why a specific action was chosen for a debtor

#### FR-23.7: CLever — Omnichannel Collection Hub Platform

> Ref: [CRIF CLever](https://www.crif.digital/solutions/clever/) — An omnichannel and client-centric collection hub. A complete and streamlined solution for flexible and configurable debt collection management. Combines workflow management, integration capabilities, and strategic decision management into an intuitive web-based user interface with comprehensive data storage, embedded BI, and extensive reporting.

**Architecture:** Microservices-based (CFF Framework) with batch processing layer (Spring Cloud Data Flow equivalent)

- **FR-23.7.1**: Unified collection hub — single platform combining workflow, decisioning, data enrichment, scoring, and monitoring
- **FR-23.7.2**: Omnichannel communication management — orchestrate all debtor touchpoints from one interface
- **FR-23.7.3**: Client-centric case view — 360° debtor profile with all interactions, balances, payment history, and enriched data
- **FR-23.7.4**: Responsive web interfaces — modern UI optimized for desktop and tablet screens
- **FR-23.7.5**: Role-based dashboards — graphs and KPIs tailored per user role (collector, team lead, manager, admin)
- **FR-23.7.6**: Portfolio performance monitoring — real-time view of delinquent portfolio health and team performance
- **FR-23.7.7**: Configurable workflow engine — flexible collection process flows adaptable per client/product/segment
- **FR-23.7.8**: Integration capabilities — connectors to external systems (core banking, bureaus, payment gateways, agencies)
- **FR-23.7.9**: Strategic decision management — embedded decision engine for automated action assignment
- **FR-23.7.10**: Comprehensive data storage — ad-hoc collection data model with full debtor lifecycle history
- **FR-23.7.11**: Embedded Business Intelligence — built-in reporting and analytics without external BI tools
- **FR-23.7.12**: Extensive reporting — pre-built and custom reports for operational and strategic insights
- **FR-23.7.13**: Manual campaign management — create and execute targeted collection campaigns
- **FR-23.7.14**: Evaluation grid — configurable scoring grid to facilitate operator evaluation of collection cases
- **FR-23.7.15**: Case summary with guarantor information — comprehensive case view including guarantor details and credit product data
- **FR-23.7.16**: Document sharing (DocShare) — secure document exchange between collectors, debtors, and agencies
- **FR-23.7.17**: User and group management — role-based access control with team hierarchy and permissions
- **FR-23.7.18**: Batch processing framework — scheduled jobs for portfolio imports, enrichment, scoring, and strategy execution
- **FR-23.7.19**: Batch monitoring and troubleshooting — real-time visibility into batch job status with minimal troubleshooting time
- **FR-23.7.20**: Platform versioning and release management — structured release cycle with release notes and support policies

**CLever Scale Benchmarks (Tier-1 Bank):**

| Metric | Capacity |
|--------|----------|
| Contracts Processed Daily | 1 Million |
| Simultaneous Users | 1,000 |
| Simultaneous Calls Processed | 6,000 |

#### FR-23.8: Advanced Analytics for Collection

> Ref: [CRIF Advanced Analytics](https://www.crif.digital/solutions/advanced-analytics/) — Empowering value creation through advanced analytics. Combines traditional scoring methodologies with Open Banking data enrichment and ML-based policy design to reduce manual review and increase automation.

**Key Results:** +15% more high-risk exposures managed in advance, -6% manual application review, +10 points automation level

- **FR-23.8.1**: Risk assessment analytics — advanced scoring models for collection risk profiling (probability of default, loss given default)
- **FR-23.8.2**: ML-based credit policy design — machine learning models to optimize collection policies and reduce manual review areas
- **FR-23.8.3**: Open Banking data enrichment for analytics — leverage transaction data for richer debtor profiling and affordability insights
- **FR-23.8.4**: Traditional + ML hybrid scoring — combine traditional statistical models with ML for best-of-both accuracy
- **FR-23.8.5**: Predictive analytics for early intervention — identify high-risk exposures before they deteriorate
- **FR-23.8.6**: Collection propensity models — predict likelihood of payment at various stages and under different strategies
- **FR-23.8.7**: Portfolio-level analytics — aggregate views of portfolio health, vintage analysis, and cohort performance
- **FR-23.8.8**: Regulatory analytics — models and reports aligned with regulatory requirements (IFRS 9, Basel III provisioning)
- **FR-23.8.9**: Model performance monitoring — track model accuracy, drift detection, and automatic retraining triggers
- **FR-23.8.10**: What-if scenario analytics — simulate impact of strategy changes on portfolio recovery before deployment
- **FR-23.8.11**: Debtor behavior clustering — unsupervised ML to discover hidden patterns in debtor payment behavior
- **FR-23.8.12**: Cost-benefit analysis engine — calculate expected recovery vs cost for each action to optimize ROI
- **FR-23.8.13**: Real-time analytics pipeline — streaming data processing for immediate insight generation on new events
- **FR-23.8.14**: Self-service analytics — business users can create custom analytics views and reports without IT support

**Target KPIs (CRIF Benchmarks):**

| KPI | Target |
|-----|--------|
| Recovery Rate Improvement | +14% |
| OPEX Cost Reduction | -20% per recovered amount |
| Roll Rate Reduction | -15% cases rolling to next bucket |
| FTE Efficiency Gain | +30% cases handled per collector |
| Auto-decisioning Rate | 70%+ collection actions automated |
| Time-to-First-Contact | < 24h from delinquency trigger |
| Strategy Deployment Time | < 1 day (no IT involvement) |

**Benefits for Financial Institutions:**
- Lower NPL ratio
- Higher recovery rates
- Lower risk costs and operating costs
- Shorter time to recovery
- Lower provisions

**Benefits for Consumers/Debtors:**
- Personalized approach
- Reduced collection fees
- Early collection reminders (prevent escalation)

---

## Non-Functional Requirements

### NFR-1: Performance

- **NFR-1.1**: Page load < 2s (P95)
- **NFR-1.2**: API response < 200ms (P95) for CRUD operations
- **NFR-1.3**: Decision engine execution < 500ms for standard rules
- **NFR-1.4**: Pre-screening response < 3s (including bureau + Open Banking data retrieval)
- **NFR-1.5**: Support 500+ concurrent users
- **NFR-1.6**: Handle 10,000+ active cases simultaneously
- **NFR-1.7**: Batch processing for bulk operations (1000+ records)
- **NFR-1.8**: 4x increase in applications processed vs manual baseline

### NFR-2: Scalability

- **NFR-2.1**: Horizontal scaling via Docker containers
- **NFR-2.2**: Database read replicas for reporting queries
- **NFR-2.3**: Queue-based async processing for heavy operations
- **NFR-2.4**: CDN for static assets
- **NFR-2.5**: Connection pooling (PgBouncer)
- **NFR-2.6**: Microservice-ready architecture (can decompose monolith later)

### NFR-3: Security

- **NFR-3.1**: Role-based access control (RBAC) with fine-grained permissions
- **NFR-3.2**: Data encryption at rest (AES-256) and in transit (TLS 1.3)
- **NFR-3.3**: PII data masking in logs and non-production environments
- **NFR-3.4**: Session management with idle timeout
- **NFR-3.5**: IP whitelisting for admin functions
- **NFR-3.6**: Penetration testing before production release
- **NFR-3.7**: SOC 2 Type II compliance readiness
- **NFR-3.8**: Open Banking data handled per PSD2 security requirements
- **NFR-3.9**: Credential vault for all external service keys (never in code)

### NFR-4: Reliability

- **NFR-4.1**: 99.9% uptime SLA
- **NFR-4.2**: Automated failover for database
- **NFR-4.3**: Circuit breaker pattern for external integrations
- **NFR-4.4**: Graceful degradation when dependencies are unavailable
- **NFR-4.5**: Point-in-time recovery (PITR) for database
- **NFR-4.6**: Disaster recovery plan with RTO < 4h, RPO < 1h

### NFR-5: Observability

- **NFR-5.1**: Structured logging (Pino) with correlation IDs
- **NFR-5.2**: Distributed tracing for cross-service calls
- **NFR-5.3**: Prometheus metrics (business + technical)
- **NFR-5.4**: Grafana dashboards for system health
- **NFR-5.5**: Alerting rules for SLA breaches and system anomalies
- **NFR-5.6**: Decision engine audit trail queryable for compliance

### NFR-6: Maintainability

- **NFR-6.1**: Modular architecture (domain-driven design)
- **NFR-6.2**: Configuration-driven behavior (minimize code changes for business rules)
- **NFR-6.3**: API versioning strategy (URL-based: /api/v1/, /api/v2/)
- **NFR-6.4**: Database migration strategy (Prisma Migrate)
- **NFR-6.5**: Feature flags for gradual rollout
- **NFR-6.6**: Comprehensive API documentation (OpenAPI 3.1)
- **NFR-6.7**: Low-code extensibility — business users can modify rules, workflows, and strategies without developer involvement

---

## Module Priority (Phased Delivery)

### Phase 1 — MVP (Core Origination + Decision Engine)
| Priority | Module | Rationale |
|----------|--------|-----------|
| P0 | Workflow Orchestration Engine (FR-2) | Foundation for all processing |
| P0 | Pre-Screening & Application Intake (FR-1) | Entry point with instant eligibility |
| P0 | Decision Engine — Core (FR-3.1–3.6) | Automated decisioning with visual designer |
| P0 | User Interface — Core (FR-10.1–10.5) | Operator workspace |
| P0 | Customer Management — Basic (FR-6.1–6.4) | Applicant data + KYC |

### Phase 2 — Enhanced Processing + Open Banking
| Priority | Module | Rationale |
|----------|--------|-----------|
| P1 | Document Management (FR-4) | Paperless processing |
| P1 | Product Catalog (FR-5) | Multi-product support |
| P1 | Open Banking & Data Enrichment (FR-7) | Alternative data, affordability |
| P1 | Integration Hub — Core (FR-9.1–9.4, 9.10) | External data + Open Banking |
| P1 | Compliance — Basic (FR-8.1–8.4) | Regulatory minimum |
| P1 | Reporting — Basic (FR-11.1–11.3) | Operational visibility |
| P1 | Disbursement (FR-12) | End-to-end completion |

### Phase 3 — Enterprise Features + AI
| Priority | Module | Rationale |
|----------|--------|-----------|
| P2 | Advanced Decision Engine (FR-3.7–3.20) | What-if, champion-challenger, ML, ESG |
| P2 | Full Compliance Suite (FR-8.5–8.11) | Regulatory completeness |
| P2 | Advanced Analytics (FR-11.4–11.12) | Strategic insights |
| P2 | Full Integration Hub (FR-9.5–9.13) | Ecosystem connectivity |
| P2 | Advanced UI (FR-10.6–10.13) | Visual strategy designer, monitoring |

### Phase 4 — Collection Platform (CLever + Decision Engine for Collection)
| Priority | Module | Rationale |
|----------|--------|-----------|
| P2 | Collection Data Enrichment (FR-23.1) | Foundation data quality for collection |
| P2 | Collection Segmentation & Scoring (FR-23.2) | Persona-based strategy routing |
| P2 | Collection Process Management (FR-23.3) | Workflow, CTI, self-collection portal |
| P2 | AI Optimization for Collection (FR-23.4) | Workforce planning, constraint optimization |
| P2 | Collection Monitoring & Improvement (FR-23.5) | BI, champion-challenger, strategy optimizer |
| P2 | Decision Engine for Collection (FR-23.6) | End-to-end decisioning integration |
| P2 | CLever Collection Hub (FR-23.7) | Unified omnichannel platform |
| P2 | Advanced Analytics for Collection (FR-23.8) | ML models, predictive analytics, risk assessment |

---

## Assumptions

1. Single-tenant deployment initially (multi-tenant in future)
2. PostgreSQL handles transactional + analytical workloads (no separate data warehouse in Phase 1)
3. English-only UI initially (i18n architecture in place for future)
4. Regulatory rules are Vietnam/ASEAN-focused initially (configurable for other jurisdictions)
5. Integration with specific credit bureaus/core banking TBD based on client requirements
6. Mobile app is responsive web (not native) in Phase 1
7. Open Banking integration assumes PSD2-compatible APIs available in target market
8. ESG scoring uses configurable criteria (no single standard mandated)
9. Decision Engine visual designer targets business analysts (not developers)
10. Champion-challenger requires minimum 1000 applications per variant for statistical significance

---

## Open Questions

1. Which specific loan products should Phase 1 support? (Personal, Mortgage, Auto, SME — pick 1-2)
2. What are the target regulatory frameworks? (Vietnam SBV regulations? Basel III? Both?)
3. Should the workflow engine support BPMN 2.0 standard notation?
4. What is the expected peak application volume per day?
5. Are there specific credit bureau integrations required for Phase 1?
6. Should the system support multi-currency from day one?
7. What level of no-code configurability is expected for business users?
8. Is there an existing core banking system to integrate with?
9. Which Open Banking providers/aggregators are available in the target market?
10. What ESG scoring framework should be adopted? (EU Taxonomy? Custom?)
11. Should the decision engine support Python/R model import for ML models?
12. What is the target auto-approval rate for STP? (CRIF achieves ~55% for retail)

---

## References

- [CRIF Loan Origination & Decision Engine](https://www.crif.com/knowledge-events/news-events/crif-loan-origination-decision-engine-transforming-the-credit-journey/) — Visual decision strategy, what-if analysis, ESG scoring, low-code orchestration
- [CRIF Digital LOS](https://www.crif.digital/solutions/loan-origination/) — Pre-screening, underwriting automation, disbursement integration
- [CRIF Time-to-Yes](https://www.crif.com/knowledge-events/news-events/how-crifs-loan-origination-solution-helps-reduce-time-to-yes/) — Automated credit scoring, decision engine capabilities
- [CRIF Open Banking Suite](https://www.crif.digital/solutions/open-banking-suite/) — Transaction categorization, affordability analysis
- [CRIF StrategyOne](https://www.crif.digital/solutions/strategyone/) — Decision management platform across customer lifecycle
- [CRIF CLever Collection Solution](https://www.crif.digital/solutions/clever/) — Omnichannel client-centric collection hub with workflow, BI, and decisioning
- [CRIF CLever Release Notes](https://www.crif.digital/solutions/clever-release-notes/) — Platform versioning, microservices architecture (CFF), batch framework, dashboard, evaluation grid
- [CRIF Advanced Analytics](https://www.crif.digital/solutions/advanced-analytics/) — Risk assessment, ML-based policy design, Open Banking enrichment for analytics
- [CRIF Decision Engine for Collection](https://www.crif.digital/use-cases/decision-engine-for-collection/) — AI optimization, strategy designer, champion-challenger, audit tracking
- [CRIF Collection Data Enrichment](https://www.crif.digital/use-cases/collection-data-enrichment/) — External data integration, validation, portfolio enrichment, data model
- [CRIF Collection Segmentation & Scoring](https://www.crif.digital/use-cases/collection-customer-segmentation-and-scoring/) — Predictive scoring, best practice segmentation, business user autonomy
- [CRIF Collection Process Management](https://www.crif.digital/use-cases/collection-process-management/) — Workflow, outsourcer management, CTI, mobile app, self-collection portal
- [CRIF Collection Monitoring](https://www.crif.digital/use-cases/collection-monitoring/) — BI & reporting, strategy optimizer, champion-challenger trials
- [CRIF Collection Platform](https://www.crif.digital/solutions/collection/) — End-to-end collection management with scoring, segmentation, and strategy diversification
- [Pega Constellation Architecture](https://academy.pega.com/topic/constellation-architecture/v1) — UI/UX patterns and case management approach
- [Pega Commercial Credit Origination](https://www.pega.com/es/insights/resources/pega-commercial-credit-origination) — Workflow and rules engine patterns
- [CRIF ESG Solutions](https://www.crif.digital/solutions/esg/) — Physical risk, transition risk, GHG emissions, regulatory ESG alignment
- [CRIF Foundation Framework (CFF)](https://www.crif.digital/solutions/crif-foundation-framework/) — Cloud-native process orchestrator, omnichannel, modular origination
- [CRIF Advanced Analytics](https://www.crif.digital/solutions/advanced-analytics/) — ML-based scoring, Open Banking enrichment, regulatory models
- [CRIF Digital Lending](https://www.crif.digital/solutions/digital-lending/) — White-label lending platform, prebuilt journeys, sandbox
- [CRIF StrategyOne](https://www.crif.digital/solutions/strategyone/) — Complete digital decisioning, augmented intelligence, cross-lifecycle
- [CRIF StrategyOne GenAI](https://www.crif.com/knowledge-events/news-events/strategyone-crif-decision-engine-integrated-genai-ecosystem/) — GenAI copilot, agentic AI, legacy migration

*Content was rephrased for compliance with licensing restrictions*
