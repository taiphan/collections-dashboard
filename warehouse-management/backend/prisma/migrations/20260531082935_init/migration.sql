-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "BarcodeFormat" AS ENUM ('EAN_13', 'UPC_A', 'CODE_128');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExportReason" AS ENUM ('SALE', 'TRANSFER', 'RETURN');

-- CreateEnum
CREATE TYPE "AuditOperationType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'WAREHOUSE_STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "image_url" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skus" (
    "id" TEXT NOT NULL,
    "catalog_item_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "weight" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcodes" (
    "id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "format" "BarcodeFormat" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_records" (
    "id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_operations" (
    "id" TEXT NOT NULL,
    "operation_number" TEXT NOT NULL,
    "type" "OperationType" NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "supplier_ref" TEXT,
    "expected_date" TIMESTAMP(3),
    "destination" TEXT,
    "reason" "ExportReason",
    "revises_id" TEXT,
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_line_items" (
    "id" TEXT NOT NULL,
    "operation_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(15,2),
    "unit_price" DECIMAL(15,2),

    CONSTRAINT "operation_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_status_log" (
    "id" TEXT NOT NULL,
    "operation_id" TEXT NOT NULL,
    "from_status" "OperationStatus" NOT NULL,
    "to_status" "OperationStatus" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "operation_type" "AuditOperationType" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cache" (
    "id" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "report_data" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "report_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "forecast_date" TIMESTAMP(3) NOT NULL,
    "predicted_qty" INTEGER NOT NULL,
    "low_estimate" INTEGER NOT NULL,
    "high_estimate" INTEGER NOT NULL,
    "methodology" TEXT NOT NULL,
    "data_start_date" TIMESTAMP(3) NOT NULL,
    "data_end_date" TIMESTAMP(3) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "catalog_items_category_idx" ON "catalog_items"("category");

-- CreateIndex
CREATE INDEX "catalog_items_name_idx" ON "catalog_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_items_name_category_key" ON "catalog_items"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "skus_code_key" ON "skus"("code");

-- CreateIndex
CREATE INDEX "skus_catalog_item_id_idx" ON "skus"("catalog_item_id");

-- CreateIndex
CREATE INDEX "skus_code_idx" ON "skus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "barcodes_value_key" ON "barcodes"("value");

-- CreateIndex
CREATE INDEX "barcodes_value_idx" ON "barcodes"("value");

-- CreateIndex
CREATE INDEX "barcodes_sku_id_idx" ON "barcodes"("sku_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_records_sku_id_key" ON "inventory_records"("sku_id");

-- CreateIndex
CREATE INDEX "inventory_records_quantity_idx" ON "inventory_records"("quantity");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_operations_operation_number_key" ON "warehouse_operations"("operation_number");

-- CreateIndex
CREATE INDEX "warehouse_operations_type_idx" ON "warehouse_operations"("type");

-- CreateIndex
CREATE INDEX "warehouse_operations_status_idx" ON "warehouse_operations"("status");

-- CreateIndex
CREATE INDEX "warehouse_operations_created_by_id_idx" ON "warehouse_operations"("created_by_id");

-- CreateIndex
CREATE INDEX "warehouse_operations_approved_at_idx" ON "warehouse_operations"("approved_at");

-- CreateIndex
CREATE INDEX "operation_line_items_operation_id_idx" ON "operation_line_items"("operation_id");

-- CreateIndex
CREATE INDEX "operation_line_items_sku_id_idx" ON "operation_line_items"("sku_id");

-- CreateIndex
CREATE INDEX "operation_status_log_operation_id_idx" ON "operation_status_log"("operation_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "report_cache_period_type_idx" ON "report_cache"("period_type");

-- CreateIndex
CREATE UNIQUE INDEX "report_cache_period_type_start_date_end_date_key" ON "report_cache"("period_type", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "predictions_sku_id_forecast_date_idx" ON "predictions"("sku_id", "forecast_date");

-- AddForeignKey
ALTER TABLE "skus" ADD CONSTRAINT "skus_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcodes" ADD CONSTRAINT "barcodes_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_records" ADD CONSTRAINT "inventory_records_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_operations" ADD CONSTRAINT "warehouse_operations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_operations" ADD CONSTRAINT "warehouse_operations_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_line_items" ADD CONSTRAINT "operation_line_items_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "warehouse_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_line_items" ADD CONSTRAINT "operation_line_items_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_status_log" ADD CONSTRAINT "operation_status_log_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "warehouse_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
