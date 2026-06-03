/**
 * Comment service. Implements Requirement 14 (4–8, 10).
 */

import { withTenant } from '@/lib/db/repositories/base';
import * as commentRepo from '@/lib/db/repositories/comments';
import * as caseRepo from '@/lib/db/repositories/cases';
import * as usersRepo from '@/lib/db/repositories/users';
import { ForbiddenError, NotFoundError, ValidationFailedError } from '@/lib/auth/errors';
import { ROLES, hasRole } from '@/lib/rbac/roles';
import * as audit from '@/lib/services/audit';
import * as notifications from '@/lib/services/notifications';
import type { TenantContext } from '@/lib/tenancy/types';

function ensureCaseAccess(
  ctx: TenantContext,
  c: { currentAssigneeUserId: string | null; createdBy: string },
): void {
  if (hasRole(ctx, ROLES.MANAGER) || hasRole(ctx, ROLES.PLATFORM_ADMIN)) return;
  if (c.currentAssigneeUserId === ctx.userId) return;
  if (c.createdBy === ctx.userId) return;
  throw new ForbiddenError();
}

export async function post(
  ctx: TenantContext,
  caseId: string,
  body: string,
  mentionUserIds: string[],
): Promise<commentRepo.CommentRow> {
  const trimmed = body.trim();
  if (trimmed.length === 0 || trimmed.length > 5000) {
    throw new ValidationFailedError({ formErrors: ['Comment body must be 1–5000 characters.'] });
  }
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, caseId);
  if (!c) throw new NotFoundError();
  ensureCaseAccess(ctx, c);

  // Validate mentioned users belong to this tenant.
  const validMentions: string[] = [];
  for (const userId of mentionUserIds) {
    const m = await usersRepo.getMembership(ctx.tenantId, userId);
    if (m) validMentions.push(userId);
  }

  const row = await commentRepo.create(q, {
    caseId,
    authorUserId: ctx.userId!,
    body: trimmed,
    mentions: validMentions,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'comment',
    artifactId: row.id,
    action: 'comment_post',
    metadata: { caseId, mentions: validMentions },
  });

  if (validMentions.length > 0) {
    await notifications.notify(ctx, {
      recipientUserIds: validMentions,
      kind: 'mention',
      caseId,
      payload: { commentId: row.id, identifier: c.identifier, snippet: trimmed.slice(0, 200) },
    });
  }

  return row;
}

export async function listForCase(
  ctx: TenantContext,
  caseId: string,
): Promise<commentRepo.CommentRow[]> {
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, caseId);
  if (!c) throw new NotFoundError();
  ensureCaseAccess(ctx, c);
  return commentRepo.listForCase(q, caseId);
}

export async function remove(ctx: TenantContext, commentId: string): Promise<void> {
  const q = withTenant(ctx.tenantId);
  const row = await commentRepo.getById(q, commentId);
  if (!row) throw new NotFoundError();
  if (
    !hasRole(ctx, ROLES.MANAGER) &&
    !hasRole(ctx, ROLES.PLATFORM_ADMIN) &&
    row.authorUserId !== ctx.userId
  ) {
    throw new ForbiddenError();
  }
  await commentRepo.softDelete(q, commentId);
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'comment',
    artifactId: commentId,
    action: 'comment_delete',
    metadata: { caseId: row.caseId },
  });
}
