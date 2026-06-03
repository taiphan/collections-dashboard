/**
 * Cases + case history repo. Tenant-scoped.
 *
 * `listForWorklist` uses keyset pagination (created_at desc, id desc) so it
 * scales to 100k cases per tenant without `OFFSET` performance cliffs
 * (Requirement 8.4).
 */

import { and, desc, eq, lt, or, sql, type SQL } from 'drizzle-orm';
import { cases, caseHistory } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export type CaseStatus = 'active' | 'resolved' | 'cancelled';

export interface CaseRow {
  id: string;
  tenantId: string;
  caseTypeId: string;
  caseTypeVersion: number;
  identifier: string;
  status: CaseStatus;
  currentStageId: string;
  currentStepId: string;
  currentAssigneeUserId: string | null;
  currentAssigneeRole: string | null;
  stageEnteredAt: Date;
  caseEnteredAt: Date;
  primaryEntityData: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorklistCursor {
  createdAt: string; // ISO
  id: string;
}

export interface WorklistFilters {
  caseTypeId?: string;
  status?: CaseStatus;
  currentStageId?: string;
  currentAssigneeUserId?: string;
  identifierContains?: string;
}

export interface WorklistPage {
  rows: CaseRow[];
  nextCursor: WorklistCursor | null;
}

const MAX_PAGE_SIZE = 200;

function rowToCase(r: typeof cases.$inferSelect): CaseRow {
  return {
    ...r,
    primaryEntityData: r.primaryEntityData as Record<string, unknown>,
  };
}

export async function getCase(q: TenantQuery, id: string): Promise<CaseRow | null> {
  const rows = await q.db
    .select()
    .from(cases)
    .where(and(eq(cases.tenantId, q.tenantId), eq(cases.id, id)))
    .limit(1);
  return rows[0] ? rowToCase(rows[0]) : null;
}

export async function listForWorklist(
  q: TenantQuery,
  opts: {
    filters?: WorklistFilters;
    cursor?: WorklistCursor;
    limit?: number;
  } = {},
): Promise<WorklistPage> {
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, opts.limit ?? 50));
  const filters = opts.filters ?? {};

  const predicates: SQL[] = [eq(cases.tenantId, q.tenantId)];
  if (filters.caseTypeId) predicates.push(eq(cases.caseTypeId, filters.caseTypeId));
  if (filters.status) predicates.push(eq(cases.status, filters.status));
  if (filters.currentStageId)
    predicates.push(eq(cases.currentStageId, filters.currentStageId));
  if (filters.currentAssigneeUserId)
    predicates.push(eq(cases.currentAssigneeUserId, filters.currentAssigneeUserId));
  if (filters.identifierContains) {
    predicates.push(
      sql`${cases.identifier} ILIKE ${'%' + filters.identifierContains + '%'}`,
    );
  }

  if (opts.cursor) {
    const cursorAt = new Date(opts.cursor.createdAt);
    // (created_at, id) < (cursorAt, cursorId) for desc keyset pagination.
    predicates.push(
      or(
        lt(cases.createdAt, cursorAt),
        and(eq(cases.createdAt, cursorAt), lt(cases.id, opts.cursor.id))!,
      )!,
    );
  }

  const where = predicates.reduce((acc, p) => and(acc, p) as SQL);

  const rows = await q.db
    .select()
    .from(cases)
    .where(where)
    .orderBy(desc(cases.createdAt), desc(cases.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit).map(rowToCase);
  const hasMore = rows.length > limit;
  const last = page[page.length - 1];
  const nextCursor: WorklistCursor | null = hasMore && last
    ? { createdAt: last.createdAt.toISOString(), id: last.id }
    : null;
  return { rows: page, nextCursor };
}

export async function createCase(
  q: TenantQuery,
  input: {
    caseTypeId: string;
    caseTypeVersion: number;
    identifier: string;
    currentStageId: string;
    currentStepId: string;
    currentAssigneeUserId: string | null;
    currentAssigneeRole: string | null;
    primaryEntityData: Record<string, unknown>;
    createdBy: string;
  },
): Promise<CaseRow> {
  const now = new Date();
  const [row] = await q.db
    .insert(cases)
    .values({
      tenantId: q.tenantId,
      caseTypeId: input.caseTypeId,
      caseTypeVersion: input.caseTypeVersion,
      identifier: input.identifier,
      currentStageId: input.currentStageId,
      currentStepId: input.currentStepId,
      currentAssigneeUserId: input.currentAssigneeUserId,
      currentAssigneeRole: input.currentAssigneeRole,
      stageEnteredAt: now,
      caseEnteredAt: now,
      primaryEntityData: input.primaryEntityData,
      createdBy: input.createdBy,
    })
    .returning();
  return rowToCase(row!);
}

export async function updateCaseState(
  q: TenantQuery,
  caseId: string,
  patch: Partial<{
    currentStageId: string;
    currentStepId: string;
    currentAssigneeUserId: string | null;
    currentAssigneeRole: string | null;
    stageEnteredAt: Date;
    primaryEntityData: Record<string, unknown>;
    status: CaseStatus;
  }>,
): Promise<CaseRow> {
  const [row] = await q.db
    .update(cases)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(cases.tenantId, q.tenantId), eq(cases.id, caseId)))
    .returning();
  return rowToCase(row!);
}

export async function recordHistory(
  q: TenantQuery,
  input: {
    caseId: string;
    fromStageId: string | null;
    toStageId: string | null;
    fromStepId: string | null;
    toStepId: string | null;
    action:
      | 'create'
      | 'update'
      | 'advance'
      | 'send_back'
      | 'reassign'
      | 'approve'
      | 'reject'
      | 'resolve';
    actorUserId: string;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  await q.db.insert(caseHistory).values({
    tenantId: q.tenantId,
    caseId: input.caseId,
    fromStageId: input.fromStageId,
    toStageId: input.toStageId,
    fromStepId: input.fromStepId,
    toStepId: input.toStepId,
    action: input.action,
    actorUserId: input.actorUserId,
    payload: input.payload ?? null,
  });
}

export async function listHistory(q: TenantQuery, caseId: string) {
  return q.db
    .select()
    .from(caseHistory)
    .where(and(eq(caseHistory.tenantId, q.tenantId), eq(caseHistory.caseId, caseId)))
    .orderBy(desc(caseHistory.occurredAt));
}
