/**
 * Attachments repo. Tenant-scoped.
 *
 * `storage_key` is required to begin with `tenants/<tenantId>/...` (Property 10);
 * the AttachmentService builds the key, this repo only persists.
 */

import { and, asc, eq, isNull } from 'drizzle-orm';
import { attachments } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export interface AttachmentRow {
  id: string;
  tenantId: string;
  caseId: string;
  uploaderUserId: string;
  filename: string;
  contentType: string;
  byteSize: number;
  storageKey: string;
  createdAt: Date;
  deletedAt: Date | null;
}

export async function create(
  q: TenantQuery,
  input: {
    caseId: string;
    uploaderUserId: string;
    filename: string;
    contentType: string;
    byteSize: number;
    storageKey: string;
  },
): Promise<AttachmentRow> {
  const [row] = await q.db
    .insert(attachments)
    .values({
      tenantId: q.tenantId,
      caseId: input.caseId,
      uploaderUserId: input.uploaderUserId,
      filename: input.filename,
      contentType: input.contentType,
      byteSize: input.byteSize,
      storageKey: input.storageKey,
    })
    .returning();
  return row!;
}

export async function listForCase(q: TenantQuery, caseId: string): Promise<AttachmentRow[]> {
  return q.db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.tenantId, q.tenantId),
        eq(attachments.caseId, caseId),
        isNull(attachments.deletedAt),
      ),
    )
    .orderBy(asc(attachments.createdAt));
}

export async function getById(q: TenantQuery, id: string): Promise<AttachmentRow | null> {
  const rows = await q.db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.tenantId, q.tenantId),
        eq(attachments.id, id),
        isNull(attachments.deletedAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function softDelete(q: TenantQuery, id: string): Promise<void> {
  await q.db
    .update(attachments)
    .set({ deletedAt: new Date() })
    .where(and(eq(attachments.tenantId, q.tenantId), eq(attachments.id, id)));
}
