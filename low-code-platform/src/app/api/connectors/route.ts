import { withCtx } from '@/lib/api/handler';
import * as service from '@/lib/services/connectors';

export const GET = withCtx(async ({ ctx }) => service.list(ctx));

export const POST = withCtx(async ({ ctx, req }) => {
  const body = await req.json();
  return service.create(ctx, body);
});
