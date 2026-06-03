import { withCtxAndParams } from '@/lib/api/handler';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as runtime from '@/lib/services/case-runtime';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { transitionId?: string; reason?: string };
  if (!body.transitionId) {
    throw new ValidationFailedError({ formErrors: ['transitionId is required.'] });
  }
  return runtime.sendBack(ctx, params.id, body.transitionId, body.reason);
});
