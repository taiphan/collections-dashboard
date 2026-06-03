import { withCtx } from '@/lib/api/handler';
import { ROLES, requireRole } from '@/lib/rbac/roles';
import * as tenantRepo from '@/lib/db/repositories/tenants';
import { designTokensSchema } from '@/lib/ui/tokens';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as audit from '@/lib/services/audit';

export const GET = withCtx(async ({ ctx }) => {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  const tenant = await tenantRepo.getById(ctx.tenantId);
  return { designTokens: tenant?.designTokens ?? null };
});

export const PUT = withCtx(async ({ ctx, req }) => {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  const body = await req.json();
  const parsed = designTokensSchema.safeParse(body ?? {});
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());
  await tenantRepo.updateDesignTokens(ctx.tenantId, parsed.data);
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'tenant',
    artifactId: ctx.tenantId,
    action: 'update',
    metadata: { kind: 'design_tokens' },
  });
  return { ok: true };
});
