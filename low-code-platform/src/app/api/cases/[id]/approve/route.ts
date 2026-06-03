import { withCtxAndParams } from '@/lib/api/handler';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as runtime from '@/lib/services/case-runtime';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { decision?: 'approve' | 'reject' };
  if (body.decision !== 'approve' && body.decision !== 'reject') {
    throw new ValidationFailedError({ formErrors: ['decision must be "approve" or "reject".'] });
  }
  return runtime.submitApproval(ctx, params.id, body.decision);
});
