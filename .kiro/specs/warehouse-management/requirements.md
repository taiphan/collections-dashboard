# Requirements Document

## Introduction

A comprehensive Warehouse Management System (WMS) for an admin warehouse user to manage catalog items, product SKUs, barcodes, warehouse import/export workflows with approval processes, reporting across multiple time periods, product querying and filtering, and analytics with predictive sales insights. The system is built as a React + Vite admin SPA backed by an Express.js API with PostgreSQL storage.

## Glossary

- **WMS**: The Warehouse Management System application
- **Admin_Warehouse**: The primary user role responsible for managing all warehouse operations
- **Catalog_Item**: A product definition containing name, description, category, and metadata
- **SKU**: Stock Keeping Unit — a unique identifier for a specific product variant
- **Barcode**: A machine-readable code (EAN-13, UPC-A, Code 128) associated with a SKU
- **Warehouse_Operation**: A transaction representing either an import (inbound) or export (outbound) of products
- **Import_Operation**: A warehouse operation that adds stock to the warehouse inventory
- **Export_Operation**: A warehouse operation that removes stock from the warehouse (sales, transfers, returns to supplier)
- **Approval_Workflow**: A multi-step review process for warehouse operations (Draft → Pending Review → Approved/Rejected)
- **Inventory_Record**: The current quantity and location of a SKU within the warehouse
- **Report_Generator**: The subsystem responsible for producing periodic reports
- **Analytics_Engine**: The subsystem responsible for computing statistics, trends, and predictions
- **Product_Filter**: The subsystem responsible for querying and filtering products based on criteria

## Requirements

### Requirement 1: Catalog Item Management

**User Story:** As an Admin_Warehouse, I want to create, read, update, and delete catalog items, so that I can maintain an accurate product catalog for the warehouse.

#### Acceptance Criteria

1. THE WMS SHALL allow Admin_Warehouse to create a Catalog_Item with the following fields: name (required, 1–100 characters), description (optional, max 500 characters), category (required, 1–50 characters), unit of measure (required, 1–30 characters), and optional image URL (max 2048 characters, must be a valid URL format)
2. IF an Admin_Warehouse attempts to create or update a Catalog_Item with a name that already exists within the same category, THEN THE WMS SHALL reject the operation and return an error message indicating the name is already in use within that category
3. WHEN a Catalog_Item is created, THE WMS SHALL assign a unique identifier and record the creation timestamp
4. WHEN a Catalog_Item is updated, THE WMS SHALL record the update timestamp and the Admin_Warehouse who performed the update
5. IF a Catalog_Item has associated Inventory_Records with quantity greater than zero, THEN THE WMS SHALL prevent deletion and return an error message indicating the item cannot be deleted while inventory exists
6. THE WMS SHALL support paginated listing of Catalog_Items with a default page size of 20 and a maximum page size of 100, and support search by name and category fields using partial text matching
7. IF an Admin_Warehouse submits a Catalog_Item with missing required fields or values exceeding the specified length limits, THEN THE WMS SHALL reject the request and return an error message identifying each field that failed validation

### Requirement 2: SKU and Barcode Management

**User Story:** As an Admin_Warehouse, I want to manage SKUs and barcodes for each catalog item, so that I can track individual product variants and scan them during warehouse operations.

#### Acceptance Criteria

1. THE WMS SHALL allow Admin_Warehouse to create one or more SKUs (up to 100 per Catalog_Item) for each Catalog_Item, where each SKU includes a unique SKU code (alphanumeric, 4 to 50 characters) and variant attributes (size as text up to 50 characters, color as text up to 30 characters, weight as a positive decimal value between 0.01 and 99999.99 in kilograms)
2. THE WMS SHALL enforce globally unique SKU codes across the entire system
3. WHEN a SKU is created, THE WMS SHALL allow associating one or more Barcodes (up to 10 per SKU) with the SKU
4. THE WMS SHALL validate Barcode format against supported types (EAN-13, UPC-A, Code 128) including check digit verification for EAN-13 and UPC-A
5. IF a Barcode value does not conform to any supported format or fails check digit verification, THEN THE WMS SHALL reject the request with an error message indicating the expected format for the detected barcode type
6. THE WMS SHALL enforce globally unique Barcode values across the entire system
7. WHEN a Barcode is scanned or searched, THE WMS SHALL return the associated SKU (code and variant attributes) and Catalog_Item (name and identifier) within 200ms
8. IF a duplicate SKU code or Barcode value is submitted, THEN THE WMS SHALL reject the request with an error message indicating which value is duplicated and the existing record it conflicts with
9. IF a SKU creation request contains missing or invalid variant attributes (non-positive weight, size or color exceeding maximum length, or empty required fields), THEN THE WMS SHALL reject the request with an error message indicating each invalid field and its constraint

### Requirement 3: Warehouse Import Operations

**User Story:** As an Admin_Warehouse, I want to create and process import operations, so that I can record incoming stock into the warehouse with proper review and approval.

#### Acceptance Criteria

1. THE WMS SHALL allow Admin_Warehouse to create an Import_Operation with a list of 1 to 500 SKUs, a quantity per SKU between 1 and 999,999 units, a supplier reference of up to 100 characters, and an expected delivery date
2. WHEN an Import_Operation is created, THE WMS SHALL set its status to Draft
3. WHEN Admin_Warehouse submits a Draft Import_Operation for review, THE WMS SHALL transition its status to Pending_Review
4. WHEN an authorized reviewer approves a Pending_Review Import_Operation, THE WMS SHALL atomically increase the Inventory_Record quantities for all SKUs in the operation and transition the operation status to Approved
5. IF the inventory update for any SKU in an approved Import_Operation fails, THEN THE WMS SHALL roll back all quantity changes for that operation and retain the Pending_Review status
6. WHEN an authorized reviewer rejects a Pending_Review Import_Operation, THE WMS SHALL require a rejection reason of up to 500 characters, transition the operation status to Rejected, and notify the Admin_Warehouse
7. THE WMS SHALL maintain an audit trail of all status transitions for each Import_Operation, recording the actor, previous status, new status, and timestamp for each transition
8. IF an Import_Operation references a SKU that does not exist, THEN THE WMS SHALL reject the operation with an error indicating which SKU identifiers are invalid

### Requirement 4: Warehouse Export Operations

**User Story:** As an Admin_Warehouse, I want to create and process export operations, so that I can record outgoing stock from the warehouse with proper review and approval.

#### Acceptance Criteria

1. THE WMS SHALL allow Admin_Warehouse to create an Export_Operation with a list of 1 to 200 SKU line items, each with a quantity between 1 and 999,999, a destination (maximum 255 characters), and a reason (sale, transfer, return)
2. WHEN an Export_Operation is created, THE WMS SHALL set its status to Draft
3. WHEN Admin_Warehouse submits a Draft Export_Operation for review, THE WMS SHALL transition its status to Pending_Review
4. WHEN an Export_Operation is approved, THE WMS SHALL atomically decrease the Inventory_Record quantities for each SKU in the operation within a single transaction
5. IF at the time of approval an Export_Operation contains a SKU whose requested quantity exceeds the current available Inventory_Record, THEN THE WMS SHALL reject the entire operation with an error message indicating which SKUs have insufficient stock and retain the operation in Pending_Review status
6. WHEN an Export_Operation is rejected, THE WMS SHALL record the rejection reason (minimum 1 character, maximum 1000 characters) and notify the Admin_Warehouse who created the operation
7. THE WMS SHALL maintain a complete audit trail of all status transitions for each Export_Operation, recording the actor identity, timestamp, previous status, and new status for each transition
8. IF an Export_Operation references a SKU that does not exist in the system, THEN THE WMS SHALL reject the creation with an error message indicating the invalid SKU

### Requirement 5: Approval Workflow

**User Story:** As an Admin_Warehouse, I want a structured approval workflow for warehouse operations, so that all imports and exports are reviewed before affecting inventory.

#### Acceptance Criteria

1. THE WMS SHALL enforce the workflow sequence: Draft → Pending_Review → Approved or Rejected
2. IF an Admin_Warehouse attempts a state transition not permitted by the workflow sequence, THEN THE WMS SHALL reject the request with an error message indicating the current status and the allowed transitions
3. WHEN a Warehouse_Operation transitions to Approved, THE WMS SHALL record the approver identity and approval timestamp, and SHALL prevent the operation creator from being the approver
4. WHEN a Warehouse_Operation transitions to Rejected, THE WMS SHALL require a rejection reason between 10 and 500 characters
5. WHILE a Warehouse_Operation is in Pending_Review status, THE WMS SHALL prevent modifications to the operation details and SHALL reject modification attempts with an error message indicating the operation is under review
6. WHEN an Admin_Warehouse cancels a Draft Warehouse_Operation, THE WMS SHALL transition the operation to Cancelled status and retain the operation record for audit purposes
7. WHEN a Warehouse_Operation is Rejected, THE WMS SHALL allow the Admin_Warehouse to create a new Draft operation referencing the rejected operation as a revision

### Requirement 6: Inventory Tracking

**User Story:** As an Admin_Warehouse, I want to view current inventory levels for all products, so that I can understand stock availability at any time.

#### Acceptance Criteria

1. THE WMS SHALL maintain an Inventory_Record for each SKU with current quantity (integer, minimum 0), warehouse location, and last updated timestamp
2. WHEN an Import_Operation is approved, THE WMS SHALL atomically increase the Inventory_Record quantity for each SKU in the operation by the corresponding import quantity
3. WHEN an Export_Operation is approved, THE WMS SHALL atomically decrease the Inventory_Record quantity for each SKU in the operation by the corresponding export quantity
4. IF an inventory update would result in a quantity below zero, THEN THE WMS SHALL reject the operation and return an error message indicating insufficient stock for the affected SKU
5. THE WMS SHALL display inventory levels updated within 5 seconds of the last modification, with the ability to filter by category, SKU, or location, and support paginated results
6. WHEN inventory quantity for a SKU falls below a configurable threshold (integer between 1 and 10,000, default 10), THE WMS SHALL visually indicate the SKU as low stock in the inventory list
7. WHEN a SKU is first created, THE WMS SHALL initialize an Inventory_Record for that SKU with a quantity of zero

### Requirement 7: Product Query and Filtering

**User Story:** As an Admin_Warehouse, I want to query and filter products by various criteria, so that I can quickly find product availability and identify top-selling items.

#### Acceptance Criteria

1. THE Product_Filter SHALL support filtering by category, SKU code, Barcode, product name, and stock status, where stock status is defined as: "in stock" (quantity > low stock threshold), "low stock" (quantity between 1 and the configured low stock threshold, inclusive), and "out of stock" (quantity = 0)
2. THE Product_Filter SHALL support sorting by name, quantity, category, last updated date, and total export volume, with each sort field supporting both ascending and descending order, defaulting to ascending order when no direction is specified
3. THE Product_Filter SHALL return results within 500ms for datasets up to 100,000 SKUs
4. THE Product_Filter SHALL support combining multiple filter criteria with AND logic
5. WHEN Admin_Warehouse queries for most exported products, THE Product_Filter SHALL rank products by total approved export quantity within a specified date range and return results in descending order of export quantity
6. THE Product_Filter SHALL support full-text search across product names and descriptions, requiring a minimum query length of 2 characters
7. THE Product_Filter SHALL return results in pages of 20 items by default, with support for configurable page sizes between 10 and 100 items per page, and include total result count in the response
8. IF no products match the applied filter criteria, THEN THE Product_Filter SHALL return an empty result set with a total count of zero
9. IF Admin_Warehouse provides an invalid date range where the start date is after the end date, THEN THE Product_Filter SHALL reject the query and return an error message indicating the invalid date range

### Requirement 8: Periodic Reporting

**User Story:** As an Admin_Warehouse, I want to generate reports on daily, weekly, monthly, quarterly, and yearly intervals, so that I can review warehouse performance over time.

#### Acceptance Criteria

1. THE Report_Generator SHALL produce reports for the following periods: daily (calendar day midnight-to-midnight), weekly (Monday 00:00:00 to Sunday 23:59:59), monthly (first day to last day of calendar month), quarterly (standard calendar quarters Q1-Q4), and yearly (January 1 to December 31)
2. WHEN a report is requested, THE Report_Generator SHALL include total imports, total exports, net inventory change, and top 10 products ranked by total unit quantity moved (imports plus exports) within the specified period
3. IF cost/price data is available for all line items in the period, THEN THE Report_Generator SHALL include financial summaries with total import cost and total export revenue
4. THE Report_Generator SHALL allow Admin_Warehouse to export reports in PDF and CSV formats
5. WHEN a report period is specified, THE Report_Generator SHALL calculate metrics using only Warehouse_Operations with Approved status whose approval timestamp falls within that period
6. THE Report_Generator SHALL cache generated reports and serve the cached version for subsequent requests with the same period type and date range, until the period ends or a new Warehouse_Operation is approved within that period
7. IF no Approved Warehouse_Operations exist within the requested period, THEN THE Report_Generator SHALL return a report with all metrics set to zero and an indication that no operations were recorded
8. THE Report_Generator SHALL complete report generation and return results within 10 seconds for periods containing up to 50,000 Warehouse_Operations

### Requirement 9: Analytics and Trend Analysis

**User Story:** As an Admin_Warehouse, I want to view statistics and trends for warehouse operations, so that I can identify patterns and make informed decisions.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL compute moving averages for import and export volumes (total unit count of Approved Warehouse_Operations) over configurable time windows (7-day, 30-day, 90-day) and return results within 3 seconds
2. THE Analytics_Engine SHALL identify top 10 and bottom 10 products by export volume for a specified period ranging from 1 day to 365 days
3. THE Analytics_Engine SHALL calculate inventory turnover rate for each SKU (total approved export quantity divided by average daily inventory over the selected time window)
4. IF average inventory for a SKU is zero during the selected time window, THEN THE Analytics_Engine SHALL report the turnover rate as not applicable for that SKU
5. THE Analytics_Engine SHALL detect seasonal patterns by comparing current period metrics against the same period in at least 1 previous year and flagging deviations greater than 20% from the historical average
6. WHEN sufficient historical data exists (minimum 90 days), THE Analytics_Engine SHALL generate trend lines for import and export volumes using linear regression over the selected time window
7. IF fewer than 90 days of historical data exist for a requested trend or seasonal analysis, THEN THE Analytics_Engine SHALL display a message indicating insufficient data and the number of additional days required
8. THE Analytics_Engine SHALL present results through visual charts (line, bar, pie) in the admin dashboard, rendering within 2 seconds for datasets up to 10,000 data points
9. THE Analytics_Engine SHALL compute all metrics using only Warehouse_Operations with Approved status

### Requirement 10: Predictive Sales and Import Planning

**User Story:** As an Admin_Warehouse, I want predictive reports on future sales and recommended import quantities, so that I can plan procurement and manufacturing effectively.

#### Acceptance Criteria

1. WHEN at least 180 days of historical export data exists for a SKU, THE Analytics_Engine SHALL generate a 30-day sales forecast broken down into daily predicted quantities
2. THE Analytics_Engine SHALL calculate recommended reorder quantities based on forecasted demand, current stock, and a configurable lead time between 1 and 180 days
3. IF forecasted demand for a SKU exceeds current inventory plus pending imports within the lead time window, THEN THE Analytics_Engine SHALL include that SKU in a "reorder alert" list visible on the predictive reports dashboard
4. THE Analytics_Engine SHALL provide confidence intervals for sales forecasts at the 10th percentile (low), 50th percentile (medium), and 90th percentile (high) estimates
5. WHEN a prediction is generated, THE Analytics_Engine SHALL display the data inputs used, the date range of historical data considered, and the forecasting methodology name
6. THE Analytics_Engine SHALL refresh predictions on a daily schedule using a background job queue
7. IF the daily prediction refresh job fails, THEN THE Analytics_Engine SHALL retain the most recent successful prediction, record the failure in the job queue, and display the timestamp of the last successful refresh to the user

### Requirement 11: Authentication and Authorization

**User Story:** As an Admin_Warehouse, I want secure access to the system with proper authentication, so that only authorized users can perform warehouse operations.

#### Acceptance Criteria

1. THE WMS SHALL require JWT-based authentication for all API endpoints
2. THE WMS SHALL issue access tokens with a maximum lifetime of 15 minutes and refresh tokens with a maximum lifetime of 7 days
3. THE WMS SHALL enforce role-based access control with the Admin_Warehouse role having full system access
4. WHEN authentication fails, THE WMS SHALL return a generic error message without revealing whether the username or password was incorrect
5. THE WMS SHALL rate-limit authentication attempts to a maximum of 5 attempts per 15-minute window per IP address
6. THE WMS SHALL validate all API inputs using schema validation at the system boundary
7. IF a request is received with a missing, malformed, or expired JWT token, THEN THE WMS SHALL reject the request and return an error indicating the token is invalid or expired without disclosing internal details
8. IF an authenticated user attempts an action not permitted by their assigned role, THEN THE WMS SHALL reject the request with an error indicating insufficient permissions
9. IF the rate limit of 5 authentication attempts per 15-minute window is exceeded for an IP address, THEN THE WMS SHALL reject subsequent authentication attempts from that IP address with an error indicating the limit has been exceeded until the 15-minute window resets

### Requirement 12: Data Integrity and Audit

**User Story:** As an Admin_Warehouse, I want all changes to be tracked and data integrity maintained, so that I can audit operations and trust the system data.

#### Acceptance Criteria

1. THE WMS SHALL record an audit log entry for every create, update, and delete operation on Catalog_Items, SKUs, Inventory_Records, and Warehouse_Operations
2. THE WMS SHALL include the actor identity, timestamp (UTC with millisecond precision), operation type, affected entity type, entity identifier, and the changed fields with their before and after values in each audit log entry
3. WHEN a Warehouse_Operation is approved, THE WMS SHALL execute all inventory updates and the corresponding audit log entries within a single database transaction to ensure atomicity
4. IF a database transaction fails during operation approval, THEN THE WMS SHALL roll back all changes and return an error response indicating the failure reason to Admin_Warehouse without revealing internal system details
5. THE WMS SHALL prevent modification or deletion of audit log entries through both application-level controls and database-level constraints
6. THE WMS SHALL retain audit log entries for a minimum of 5 years
7. THE WMS SHALL provide Admin_Warehouse with the ability to query audit log entries filtered by entity type, entity identifier, actor, operation type, and date range, returning results within 2 seconds for queries spanning up to 90 days
