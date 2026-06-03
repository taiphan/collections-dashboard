import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/notifications';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) => {
  await service.markRead(ctx, params.id);
  return { ok: true };
});
