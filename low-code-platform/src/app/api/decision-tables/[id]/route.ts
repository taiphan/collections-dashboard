import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/decision-tables';

export const GET = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) =>
  service.getById(ctx, params.id),
);

export const PATCH = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { definition: unknown };
  await service.update(ctx, params.id, body.definition);
  return { ok: true };
});
