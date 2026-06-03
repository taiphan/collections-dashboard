import { withCtxAndParams } from '@/lib/api/handler';
import { ValidationFailedError } from '@/lib/auth/errors';
import * as runtime from '@/lib/services/case-runtime';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { newAssigneeUserId?: string };
  if (!body.newAssigneeUserId) {
    throw new ValidationFailedError({ formErrors: ['newAssigneeUserId is required.'] });
  }
  return runtime.reassign(ctx, params.id, body.newAssigneeUserId);
});
