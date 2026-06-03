import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/case-designer';

export const GET = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) =>
  service.getCaseType(ctx, params.id),
);

export const PATCH = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { definition: unknown };
  return service.updateCaseType(ctx, params.id, body.definition);
});
