import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/data-model';

export const GET = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) =>
  service.getEntity(ctx, params.id),
);

export const PATCH = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { definition: unknown };
  return service.updateEntity(ctx, params.id, body.definition);
});
