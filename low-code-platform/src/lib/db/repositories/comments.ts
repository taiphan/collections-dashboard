/**
 * Comments repo. Tenant-scoped.
 */

import { and, asc, eq, isNull } from 'drizzle-orm';
import { comments } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export interface CommentRow {
  id: string;
  tenantId: string;
  caseId: string;
  authorUserId: string;
  body: string;
  mentions: string[];
  createdAt: Date;
  deletedAt: Date | null;
}

export async function create(
  q: TenantQuery,
  input: {
    caseId: string;
    authorUserId: string;
    body: string;
    mentions: string[];
  },
): Promise<CommentRow> {
  const [row] = await q.db
    .insert(comments)
    .values({
      tenantId: q.tenantId,
      caseId: input.caseId,
      authorUserId: input.authorUserId,
      body: input.body,
      mentions: input.mentions,
    })
    .returning();
  return row!;
}

export async function listForCase(q: TenantQuery, caseId: string): Promise<CommentRow[]> {
  return q.db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.tenantId, q.tenantId),
        eq(comments.caseId, caseId),
        isNull(comments.deletedAt),
      ),
    )
    .orderBy(asc(comments.createdAt));
}

export async function getById(q: TenantQuery, id: string): Promise<CommentRow | null> {
  const rows = await q.db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.tenantId, q.tenantId),
        eq(comments.id, id),
        isNull(comments.deletedAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function softDelete(q: TenantQuery, id: string): Promise<void> {
  await q.db
    .update(comments)
    .set({ deletedAt: new Date() })
    .where(and(eq(comments.tenantId, q.tenantId), eq(comments.id, id)));
}
