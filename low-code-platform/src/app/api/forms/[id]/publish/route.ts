import { withCtxAndParams } from '@/lib/api/handler';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as service from '@/lib/services/form-designer';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json().catch(() => ({}))) as { version?: number };
  if (typeof body.version !== 'number' || body.version <= 0) {
    throw new ValidationFailedError({ formErrors: ['version is required and must be > 0.'] });
  }
  await service.publishForm(ctx, params.id, body.version);
  return { ok: true };
});
