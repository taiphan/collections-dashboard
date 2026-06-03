/**
 * Audit repo. Append-only at the database level (Property 3 / Requirement 10.3).
 *
 * Only `record` and `query` are exposed. Any UPDATE or DELETE issued against
 * `audit_log` is rejected by the trigger added in migration
 * `0001_audit_log_append_only.sql`.
 */

import { and, desc, eq, type SQL } from 'drizzle-orm';
import { auditLog } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export type AuditAction =
  | 'create'
  | 'update'
  | 'publish'
  | 'delete'
  | 'advance'
  | 'send_back'
  | 'reassign'
  | 'approve'
  | 'reject'
  | 'resolve'
  | 'comment_post'
  | 'comment_delete'
  | 'attachment_upload'
  | 'attachment_delete';

export interface AuditEntryInput {
  actorUserId: string | null;
  artifactType: string;
  artifactId: string;
  action: AuditAction;
  beforeRef?: string | null;
  afterRef?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditEntryRow {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  artifactType: string;
  artifactId: string;
  action: AuditAction;
  beforeRef: string | null;
  afterRef: string | null;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

export async function record(q: TenantQuery, input: AuditEntryInput): Promise<string> {
  const [row] = await q.db
    .insert(auditLog)
    .values({
      tenantId: q.tenantId,
      actorUserId: input.actorUserId,
      artifactType: input.artifactType,
      artifactId: input.artifactId,
      action: input.action,
      beforeRef: input.beforeRef ?? null,
      afterRef: input.afterRef ?? null,
      metadata: input.metadata ?? {},
    })
    .returning({ id: auditLog.id });
  return row!.id;
}

export interface AuditQuery {
  artifactType?: string;
  artifactId?: string;
  actorUserId?: string;
  limit?: number;
}

export async function query(q: TenantQuery, opts: AuditQuery = {}): Promise<AuditEntryRow[]> {
  const limit = Math.min(500, Math.max(1, opts.limit ?? 100));
  const predicates: SQL[] = [eq(auditLog.tenantId, q.tenantId)];
  if (opts.artifactType) predicates.push(eq(auditLog.artifactType, opts.artifactType));
  if (opts.artifactId) predicates.push(eq(auditLog.artifactId, opts.artifactId));
  if (opts.actorUserId) predicates.push(eq(auditLog.actorUserId, opts.actorUserId));
  const where = predicates.reduce((acc, p) => and(acc, p) as SQL);

  const rows = await q.db
    .select()
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.occurredAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    metadata: r.metadata as Record<string, unknown>,
  }));
}
