import { withCtxAndParams } from '@/lib/api/handler';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as service from '@/lib/services/admin';

export const PATCH = withCtxAndParams<{ userId: string }, unknown>(
  async ({ ctx, req, params }) => {
    const body = (await req.json()) as { roles?: string[] };
    if (!Array.isArray(body.roles)) {
      throw new ValidationFailedError({ formErrors: ['roles array is required.'] });
    }
    await service.updateRoles(ctx, params.userId, body.roles);
    return { ok: true };
  },
);

export const DELETE = withCtxAndParams<{ userId: string }, unknown>(
  async ({ ctx, params }) => {
    await service.revokeMembership(ctx, params.userId);
    return { ok: true };
  },
);
