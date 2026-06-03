import { withCtxAndParams } from '@/lib/api/handler';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as service from '@/lib/services/releases';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { decision?: 'approve' | 'reject'; comment?: string };
  if (body.decision !== 'approve' && body.decision !== 'reject') {
    throw new ValidationFailedError({ formErrors: ['decision must be "approve" or "reject".'] });
  }
  return service.decide(ctx, params.id, body.decision, body.comment);
});
