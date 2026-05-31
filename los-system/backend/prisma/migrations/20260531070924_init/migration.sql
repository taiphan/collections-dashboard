-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'UNDERWRITER', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER', 'VIEWER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PERSONAL', 'MORTGAGE', 'AUTO', 'SME', 'COMMERCIAL', 'CREDIT_LINE');

-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('FIXED', 'VARIABLE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ApplicationChannel" AS ENUM ('WEB', 'MOBILE', 'BRANCH', 'API');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'DISBURSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('INTAKE', 'VERIFICATION', 'UNDERWRITING', 'APPROVAL', 'DOCUMENTATION', 'DISBURSEMENT', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'ESCALATED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('MANUAL', 'AUTOMATED', 'APPROVAL', 'DOCUMENT_REVIEW', 'VERIFICATION');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STAGE_CHANGE', 'STATUS_CHANGE', 'ASSIGNMENT', 'COMMENT', 'DOCUMENT_UPLOAD', 'DECISION_MADE', 'TASK_COMPLETED', 'SLA_WARNING', 'SLA_BREACH', 'ESCALATION', 'COMPLIANCE_CHECK', 'DISBURSEMENT');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('PRE_QUALIFICATION', 'CREDIT_CHECK', 'UNDERWRITING', 'FINAL_APPROVAL', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "DecisionOutcome" AS ENUM ('APPROVED', 'REJECTED', 'REFERRED', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LOAN_OFFICER',
    "department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customer_type" "CustomerType" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "national_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "employment_info" JSONB,
    "financial_info" JSONB,
    "risk_grade" TEXT,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kyc_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "product_type" "ProductType" NOT NULL,
    "min_amount" DECIMAL(15,2) NOT NULL,
    "max_amount" DECIMAL(15,2) NOT NULL,
    "min_tenure_months" INTEGER NOT NULL,
    "max_tenure_months" INTEGER NOT NULL,
    "base_interest_rate" DECIMAL(5,4) NOT NULL,
    "interest_type" "InterestType" NOT NULL,
    "fees" JSONB,
    "eligibility_criteria" JSONB,
    "required_documents" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "application_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "requested_amount" DECIMAL(15,2) NOT NULL,
    "requested_tenure" INTEGER NOT NULL,
    "purpose" TEXT,
    "channel" "ApplicationChannel" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_applicants" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "national_id" TEXT,
    "income" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "co_applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "assigned_to" TEXT,
    "current_stage" "CaseStage" NOT NULL DEFAULT 'INTAKE',
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CasePriority" NOT NULL DEFAULT 'NORMAL',
    "sla_deadline" TIMESTAMP(3),
    "sla_breached" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_history" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "from_stage" "CaseStage" NOT NULL,
    "to_stage" "CaseStage" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_tasks" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "stage" "CaseStage" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_to" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "result" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_activities" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT,
    "activity_type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_comments" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "decision_type" "DecisionType" NOT NULL,
    "outcome" "DecisionOutcome" NOT NULL,
    "score" INTEGER,
    "reasoning" JSONB,
    "conditions" JSONB,
    "decided_by" TEXT,
    "is_automated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_rules" (
    "id" TEXT NOT NULL,
    "rule_set_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_rule_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT,
    "customer_id" TEXT,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "product_type" "ProductType" NOT NULL,
    "stages" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_configs" (
    "id" TEXT NOT NULL,
    "stage" "CaseStage" NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "warning_hours" INTEGER NOT NULL,
    "breach_hours" INTEGER NOT NULL,
    "escalate_to" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_national_id_key" ON "customers"("national_id");

-- CreateIndex
CREATE INDEX "customers_national_id_idx" ON "customers"("national_id");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "loan_products_code_key" ON "loan_products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "applications_application_number_key" ON "applications"("application_number");

-- CreateIndex
CREATE INDEX "applications_customer_id_idx" ON "applications"("customer_id");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_application_number_idx" ON "applications"("application_number");

-- CreateIndex
CREATE UNIQUE INDEX "cases_case_number_key" ON "cases"("case_number");

-- CreateIndex
CREATE UNIQUE INDEX "cases_application_id_key" ON "cases"("application_id");

-- CreateIndex
CREATE INDEX "cases_current_stage_idx" ON "cases"("current_stage");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_assigned_to_idx" ON "cases"("assigned_to");

-- CreateIndex
CREATE INDEX "cases_sla_deadline_idx" ON "cases"("sla_deadline");

-- CreateIndex
CREATE INDEX "stage_history_case_id_idx" ON "stage_history"("case_id");

-- CreateIndex
CREATE INDEX "case_tasks_case_id_stage_idx" ON "case_tasks"("case_id", "stage");

-- CreateIndex
CREATE INDEX "case_tasks_status_idx" ON "case_tasks"("status");

-- CreateIndex
CREATE INDEX "case_activities_case_id_idx" ON "case_activities"("case_id");

-- CreateIndex
CREATE INDEX "case_comments_case_id_idx" ON "case_comments"("case_id");

-- CreateIndex
CREATE INDEX "decisions_case_id_idx" ON "decisions"("case_id");

-- CreateIndex
CREATE INDEX "decision_rules_rule_set_id_idx" ON "decision_rules"("rule_set_id");

-- CreateIndex
CREATE UNIQUE INDEX "decision_rule_sets_name_key" ON "decision_rule_sets"("name");

-- CreateIndex
CREATE INDEX "documents_application_id_idx" ON "documents"("application_id");

-- CreateIndex
CREATE INDEX "documents_customer_id_idx" ON "documents"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_name_key" ON "workflow_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sla_configs_stage_product_type_key" ON "sla_configs"("stage", "product_type");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "loan_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_applicants" ADD CONSTRAINT "co_applicants_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_activities" ADD CONSTRAINT "case_activities_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_activities" ADD CONSTRAINT "case_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_rules" ADD CONSTRAINT "decision_rules_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "decision_rule_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
