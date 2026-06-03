import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/form-designer';

export const GET = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) =>
  service.getForm(ctx, params.id),
);

export const PATCH = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { definition: unknown };
  return service.updateForm(ctx, params.id, body.definition);
});
