/**
 * Notifications repo. Tenant-scoped.
 */

import { and, desc, eq, isNotNull, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import { notifications } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export type NotificationKind =
  | 'assignment'
  | 'sla_warning'
  | 'sla_breach'
  | 'reassignment'
  | 'send_back'
  | 'mention'
  | 'comment_reply';

export type EmailState = 'none' | 'queued' | 'sent' | 'failed';

export interface NotificationRow {
  id: string;
  tenantId: string;
  recipientUserId: string;
  kind: NotificationKind;
  caseId: string | null;
  payload: Record<string, unknown>;
  readAt: Date | null;
  emailState: EmailState;
  emailAttempts: number;
  emailNextAttemptAt: Date | null;
  createdAt: Date;
}

function rowToRecord(r: typeof notifications.$inferSelect): NotificationRow {
  return { ...r, payload: r.payload as Record<string, unknown> };
}

export async function insertMany(
  q: TenantQuery,
  rows: Array<{
    recipientUserId: string;
    kind: NotificationKind;
    caseId?: string | null;
    payload?: Record<string, unknown>;
    queueEmail: boolean;
  }>,
): Promise<NotificationRow[]> {
  if (rows.length === 0) return [];
  const inserted = await q.db
    .insert(notifications)
    .values(
      rows.map((r) => ({
        tenantId: q.tenantId,
        recipientUserId: r.recipientUserId,
        kind: r.kind,
        caseId: r.caseId ?? null,
        payload: r.payload ?? {},
        emailState: r.queueEmail ? ('queued' as EmailState) : ('none' as EmailState),
        emailNextAttemptAt: r.queueEmail ? new Date() : null,
      })),
    )
    .returning();
  return inserted.map(rowToRecord);
}

export interface NotificationCursor {
  createdAt: string;
  id: string;
}

export async function listForRecipient(
  q: TenantQuery,
  userId: string,
  opts: { unreadOnly?: boolean; cursor?: NotificationCursor; limit?: number } = {},
): Promise<{ rows: NotificationRow[]; nextCursor: NotificationCursor | null }> {
  const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
  const predicates: SQL[] = [
    eq(notifications.tenantId, q.tenantId),
    eq(notifications.recipientUserId, userId),
  ];
  if (opts.unreadOnly) predicates.push(isNull(notifications.readAt));
  if (opts.cursor) {
    const cursorAt = new Date(opts.cursor.createdAt);
    predicates.push(
      or(
        lt(notifications.createdAt, cursorAt),
        and(eq(notifications.createdAt, cursorAt), lt(notifications.id, opts.cursor.id))!,
      )!,
    );
  }
  const where = predicates.reduce((acc, p) => and(acc, p) as SQL);

  const rows = await q.db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit).map(rowToRecord);
  const hasMore = rows.length > limit;
  const last = page[page.length - 1];
  return {
    rows: page,
    nextCursor:
      hasMore && last ? { createdAt: last.createdAt.toISOString(), id: last.id } : null,
  };
}

export async function markRead(q: TenantQuery, userId: string, id: string): Promise<void> {
  await q.db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.tenantId, q.tenantId),
        eq(notifications.recipientUserId, userId),
        eq(notifications.id, id),
        isNull(notifications.readAt),
      ),
    );
}

export async function unreadCount(q: TenantQuery, userId: string): Promise<number> {
  const rows = await q.db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.tenantId, q.tenantId),
        eq(notifications.recipientUserId, userId),
        isNull(notifications.readAt),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

/**
 * Worker-side: pull a batch of queued email rows. Uses SKIP LOCKED so multiple
 * worker replicas don't double-dispatch.
 */
export async function claimEmailQueue(
  db: TenantQuery['db'],
  limit: number,
): Promise<NotificationRow[]> {
  const rows = await db.execute<typeof notifications.$inferSelect>(sql`
    SELECT * FROM notifications
    WHERE email_state = 'queued'
      AND (email_next_attempt_at IS NULL OR email_next_attempt_at <= now())
    ORDER BY created_at ASC
    LIMIT ${limit}
    FOR UPDATE SKIP LOCKED
  `);
  // pg returns `rows` on the result.
  const list = (rows as unknown as { rows: typeof notifications.$inferSelect[] }).rows ?? rows;
  return (list as typeof notifications.$inferSelect[]).map(rowToRecord);
}

export async function markEmailSent(
  db: TenantQuery['db'],
  id: string,
): Promise<void> {
  await db
    .update(notifications)
    .set({ emailState: 'sent' as EmailState, emailNextAttemptAt: null })
    .where(eq(notifications.id, id));
}

export async function markEmailFailedRetry(
  db: TenantQuery['db'],
  id: string,
  nextAttemptAt: Date,
): Promise<void> {
  await db
    .update(notifications)
    .set({
      emailAttempts: sql`${notifications.emailAttempts} + 1`,
      emailNextAttemptAt: nextAttemptAt,
    })
    .where(eq(notifications.id, id));
}

export async function markEmailFailedFinal(
  db: TenantQuery['db'],
  id: string,
): Promise<void> {
  await db
    .update(notifications)
    .set({
      emailState: 'failed' as EmailState,
      emailAttempts: sql`${notifications.emailAttempts} + 1`,
      emailNextAttemptAt: null,
    })
    .where(eq(notifications.id, id));
}

// Suppress unused import warning when callers only need part of this file.
const _suppressUnusedNotNull = isNotNull;
void _suppressUnusedNotNull;
