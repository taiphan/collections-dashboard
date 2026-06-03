import { withCtxAndParams } from '@/lib/api/handler';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as service from '@/lib/services/data-model';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json().catch(() => ({}))) as { version?: number };
  if (typeof body.version !== 'number' || body.version <= 0) {
    throw new ValidationFailedError({ formErrors: ['version is required and must be > 0.'] });
  }
  await service.publishEntity(ctx, params.id, body.version);
  return { ok: true };
});
