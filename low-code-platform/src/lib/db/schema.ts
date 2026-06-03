/**
 * Drizzle schema for the low-code platform.
 *
 * Conventions:
 * - Every tenant-scoped table has a `tenantId` column with a non-null FK to `tenants`.
 * - Design artifacts use a head row (entities/forms/case_types) plus an
 *   immutable per-version row (entity_versions/form_versions/case_type_versions).
 * - `audit_log` is append-only; a SQL trigger added in a separate migration
 *   raises on UPDATE / DELETE (Property 3).
 */

import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  bigint,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const caseStatusEnum = pgEnum('case_status', [
  'active',
  'resolved',
  'cancelled',
]);

export const emailStateEnum = pgEnum('email_state', [
  'none',
  'queued',
  'sent',
  'failed',
]);

export const notificationKindEnum = pgEnum('notification_kind', [
  'assignment',
  'sla_warning',
  'sla_breach',
  'reassignment',
  'send_back',
  'mention',
  'comment_reply',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'publish',
  'delete',
  'advance',
  'send_back',
  'reassign',
  'approve',
  'reject',
  'resolve',
  'comment_post',
  'comment_delete',
  'attachment_upload',
  'attachment_delete',
]);

// ---------------------------------------------------------------------------
// Tenants & users
// ---------------------------------------------------------------------------

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subdomain: text('subdomain').notNull(),
    name: text('name').notNull(),
    /** Per-tenant branding tokens; structure validated by lib/ui/tokens. */
    designTokens: jsonb('design_tokens'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('tenants_subdomain_unique').on(t.subdomain)],
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('users_email_unique').on(t.email)],
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roles: text('roles').array().notNull().default(sql`ARRAY[]::text[]`),
    emailPrefs: jsonb('email_prefs')
      .$type<{ assignments: boolean; sla: boolean; mentions: boolean }>()
      .notNull()
      .default(sql`'{"assignments":true,"sla":true,"mentions":true}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('memberships_tenant_user_unique').on(t.tenantId, t.userId)],
);

// ---------------------------------------------------------------------------
// Design artifacts
// ---------------------------------------------------------------------------

export const entities = pgTable(
  'entities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    label: text('label').notNull(),
    publishedVersion: integer('published_version'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('entities_tenant_name_unique').on(t.tenantId, t.name),
    index('entities_tenant_idx').on(t.tenantId),
  ],
);

export const entityVersions = pgTable(
  'entity_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    definition: jsonb('definition').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('entity_versions_unique').on(t.entityId, t.version),
    index('entity_versions_tenant_idx').on(t.tenantId),
  ],
);

export const forms = pgTable(
  'forms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    label: text('label').notNull(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id),
    publishedVersion: integer('published_version'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('forms_tenant_name_unique').on(t.tenantId, t.name),
    index('forms_tenant_entity_idx').on(t.tenantId, t.entityId),
  ],
);

export const formVersions = pgTable(
  'form_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    formId: uuid('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    definition: jsonb('definition').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('form_versions_unique').on(t.formId, t.version),
    index('form_versions_tenant_idx').on(t.tenantId),
  ],
);

export const caseTypes = pgTable(
  'case_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    label: text('label').notNull(),
    primaryEntityId: uuid('primary_entity_id')
      .notNull()
      .references(() => entities.id),
    publishedVersion: integer('published_version'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('case_types_tenant_name_unique').on(t.tenantId, t.name),
    index('case_types_tenant_idx').on(t.tenantId),
  ],
);

export const caseTypeVersions = pgTable(
  'case_type_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseTypeId: uuid('case_type_id')
      .notNull()
      .references(() => caseTypes.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    definition: jsonb('definition').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('case_type_versions_unique').on(t.caseTypeId, t.version),
    index('case_type_versions_tenant_idx').on(t.tenantId),
  ],
);

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

export const cases = pgTable(
  'cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseTypeId: uuid('case_type_id')
      .notNull()
      .references(() => caseTypes.id),
    /** Pinned per Property 2. */
    caseTypeVersion: integer('case_type_version').notNull(),
    identifier: text('identifier').notNull(),
    status: caseStatusEnum('status').notNull().default('active'),
    currentStageId: text('current_stage_id').notNull(),
    currentStepId: text('current_step_id').notNull(),
    currentAssigneeUserId: uuid('current_assignee_user_id').references(() => users.id),
    currentAssigneeRole: text('current_assignee_role'),
    stageEnteredAt: timestamp('stage_entered_at', { withTimezone: true }).notNull(),
    caseEnteredAt: timestamp('case_entered_at', { withTimezone: true }).notNull(),
    primaryEntityData: jsonb('primary_entity_data')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('cases_tenant_identifier_unique').on(t.tenantId, t.identifier),
    index('cases_tenant_status_type_idx').on(t.tenantId, t.status, t.caseTypeId),
    index('cases_tenant_assignee_idx').on(t.tenantId, t.currentAssigneeUserId),
    index('cases_tenant_keyset_idx').on(t.tenantId, t.createdAt, t.id),
  ],
);

export const caseHistory = pgTable(
  'case_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    fromStageId: text('from_stage_id'),
    toStageId: text('to_stage_id'),
    fromStepId: text('from_step_id'),
    toStepId: text('to_step_id'),
    action: auditActionEnum('action').notNull(),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.id),
    payload: jsonb('payload'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('case_history_tenant_case_idx').on(t.tenantId, t.caseId, t.occurredAt)],
);

// ---------------------------------------------------------------------------
// Attachments & comments
// ---------------------------------------------------------------------------

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    uploaderUserId: uuid('uploader_user_id')
      .notNull()
      .references(() => users.id),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    storageKey: text('storage_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('attachments_tenant_case_idx').on(t.tenantId, t.caseId)],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id),
    body: text('body').notNull(),
    mentions: uuid('mentions').array().notNull().default(sql`ARRAY[]::uuid[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('comments_tenant_case_idx').on(t.tenantId, t.caseId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    recipientUserId: uuid('recipient_user_id')
      .notNull()
      .references(() => users.id),
    kind: notificationKindEnum('kind').notNull(),
    caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
    payload: jsonb('payload')
      .notNull()
      .default(sql`'{}'::jsonb`),
    readAt: timestamp('read_at', { withTimezone: true }),
    emailState: emailStateEnum('email_state').notNull().default('none'),
    emailAttempts: integer('email_attempts').notNull().default(0),
    emailNextAttemptAt: timestamp('email_next_attempt_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('notifications_tenant_recipient_idx').on(
      t.tenantId,
      t.recipientUserId,
      t.readAt,
      t.createdAt,
    ),
    index('notifications_email_queue_idx').on(t.emailState, t.emailNextAttemptAt),
  ],
);

// ---------------------------------------------------------------------------
// Audit log (append-only; trigger enforced)
// ---------------------------------------------------------------------------

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    artifactType: text('artifact_type').notNull(),
    artifactId: uuid('artifact_id').notNull(),
    action: auditActionEnum('action').notNull(),
    beforeRef: text('before_ref'),
    afterRef: text('after_ref'),
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_log_tenant_artifact_idx').on(
      t.tenantId,
      t.artifactType,
      t.artifactId,
      t.occurredAt,
    ),
  ],
);

// ---------------------------------------------------------------------------
// V2 — connectors, decision tables, releases
// ---------------------------------------------------------------------------

export const connectors = pgTable(
  'connectors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    label: text('label').notNull(),
    /** rest | soap | db | file. MVP only ships `rest`. */
    kind: text('kind').notNull(),
    /** Non-secret config: baseUrl, default headers, timeoutMs, etc. */
    config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
    /** Optional reference to a stored credential (kept abstract — adapter resolves it). */
    credentialRef: text('credential_ref'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('connectors_tenant_name_unique').on(t.tenantId, t.name)],
);

export const decisionTables = pgTable(
  'decision_tables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    label: text('label').notNull(),
    /** DecisionTableDefinition — input columns, output columns, ordered rows. */
    definition: jsonb('definition').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('decision_tables_tenant_name_unique').on(t.tenantId, t.name)],
);

export const releases = pgTable(
  'releases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Source tenant that authored the release. */
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Manifest: list of artifacts + design versions included in the release. */
    manifest: jsonb('manifest').notNull(),
    /** none | single | dual — number of approvals required before promotion. */
    approvalPolicy: text('approval_policy').notNull().default('none'),
    /** draft | approved | promoted */
    status: text('status').notNull().default('draft'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('releases_tenant_name_unique').on(t.tenantId, t.name)],
);

export const releaseApprovals = pgTable(
  'release_approvals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    releaseId: uuid('release_id')
      .notNull()
      .references(() => releases.id, { onDelete: 'cascade' }),
    approverUserId: uuid('approver_user_id')
      .notNull()
      .references(() => users.id),
    /** approve | reject */
    decision: text('decision').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('release_approvals_unique').on(t.releaseId, t.approverUserId)],
);

// ---------------------------------------------------------------------------
// Aggregate export for repositories
// ---------------------------------------------------------------------------

export const schema = {
  tenants,
  users,
  memberships,
  entities,
  entityVersions,
  forms,
  formVersions,
  caseTypes,
  caseTypeVersions,
  cases,
  caseHistory,
  attachments,
  comments,
  notifications,
  auditLog,
  connectors,
  decisionTables,
  releases,
  releaseApprovals,
};

// Suppress unused-warning when compiled apps only need re-exports above.
export const _primaryKeyHelper = primaryKey;
