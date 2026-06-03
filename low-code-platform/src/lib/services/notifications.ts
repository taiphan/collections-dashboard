/**
 * Notification service. Implements Requirement 13.
 *
 * Persists in-app notifications and queues email when each recipient's
 * preference allows (Property 9). Worker-side delivery lives in `worker/`.
 */

import { withTenant } from '@/lib/db/repositories/base';
import * as notifRepo from '@/lib/db/repositories/notifications';
import * as usersRepo from '@/lib/db/repositories/users';
import type { TenantContext } from '@/lib/tenancy/types';
import type { NotificationKind } from '@/lib/db/repositories/notifications';

type EmailKey = keyof Pick<{
  assignments: boolean;
  sla: boolean;
  mentions: boolean;
}, 'assignments' | 'sla' | 'mentions'>;

function emailPrefKeyForKind(kind: NotificationKind): EmailKey {
  switch (kind) {
    case 'assignment':
    case 'reassignment':
    case 'send_back':
      return 'assignments';
    case 'sla_warning':
    case 'sla_breach':
      return 'sla';
    case 'mention':
    case 'comment_reply':
      return 'mentions';
  }
}

export interface NotifyInput {
  /** Either a list of user ids, a list of role names, or a mix. */
  recipientUserIds?: string[];
  recipientRoles?: string[];
  kind: NotificationKind;
  caseId?: string | null;
  payload?: Record<string, unknown>;
}

export async function notify(ctx: TenantContext, input: NotifyInput): Promise<void> {
  const q = withTenant(ctx.tenantId);

  const userIds = new Set<string>(input.recipientUserIds ?? []);
  if (input.recipientRoles && input.recipientRoles.length > 0) {
    for (const role of input.recipientRoles) {
      const members = await usersRepo.listMembersWithRole(ctx.tenantId, role);
      members.forEach((m) => userIds.add(m.userId));
    }
  }

  if (userIds.size === 0) return;

  // Look up email prefs in bulk so we can decide queueEmail per recipient.
  const allMembers = await usersRepo.listMembersOfTenant(ctx.tenantId);
  const prefByUserId = new Map(allMembers.map((m) => [m.userId, m.emailPrefs]));
  const emailKey = emailPrefKeyForKind(input.kind);

  const rows = Array.from(userIds).map((userId) => ({
    recipientUserId: userId,
    kind: input.kind,
    caseId: input.caseId ?? null,
    payload: input.payload ?? {},
    queueEmail: Boolean(prefByUserId.get(userId)?.[emailKey] ?? false),
  }));

  await notifRepo.insertMany(q, rows);
}

export async function listForCurrentUser(
  ctx: TenantContext,
  opts: { unreadOnly?: boolean; cursor?: notifRepo.NotificationCursor; limit?: number } = {},
) {
  const q = withTenant(ctx.tenantId);
  return notifRepo.listForRecipient(q, ctx.userId!, opts);
}

export async function markRead(ctx: TenantContext, id: string): Promise<void> {
  const q = withTenant(ctx.tenantId);
  await notifRepo.markRead(q, ctx.userId!, id);
}

export async function unreadCount(ctx: TenantContext): Promise<number> {
  const q = withTenant(ctx.tenantId);
  return notifRepo.unreadCount(q, ctx.userId!);
}
