import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/releases';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = await req.json();
  return service.promote(ctx, params.id, body);
});
