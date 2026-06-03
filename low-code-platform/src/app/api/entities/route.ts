import { withCtx } from '@/lib/api/handler';
import * as service from '@/lib/services/data-model';

export const GET = withCtx(async ({ ctx }) => service.listEntities(ctx));

export const POST = withCtx(async ({ ctx, req }) => {
  const body = await req.json();
  return service.createEntity(ctx, body);
});
