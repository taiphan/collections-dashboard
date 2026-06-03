/**
 * Audit service.
 *
 * Wraps the audit repo so services emit consistent entries. Manager / admin
 * role gate on reads is enforced here per Requirement 10.5.
 */

import * as auditRepo from '@/lib/db/repositories/audit';
import { withTenant } from '@/lib/db/repositories/base';
import { ROLES, requireAnyRole } from '@/lib/rbac/roles';
import type { TenantContext } from '@/lib/tenancy/types';

export async function record(ctx: TenantContext, input: auditRepo.AuditEntryInput): Promise<void> {
  const q = withTenant(ctx.tenantId);
  await auditRepo.record(q, {
    ...input,
    actorUserId: input.actorUserId ?? ctx.userId,
  });
}

export async function query(
  ctx: TenantContext,
  opts: auditRepo.AuditQuery = {},
): Promise<auditRepo.AuditEntryRow[]> {
  requireAnyRole(ctx, [ROLES.MANAGER, ROLES.PLATFORM_ADMIN]);
  return auditRepo.query(withTenant(ctx.tenantId), opts);
}
