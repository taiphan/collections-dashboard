import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/comments';

export const DELETE = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) => {
  await service.remove(ctx, params.id);
  return { ok: true };
});
