import { withCtxAndParams } from '@/lib/api/handler';
import * as service from '@/lib/services/decision-tables';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { inputs: Record<string, unknown> };
  return service.evaluateById(ctx, params.id, body.inputs ?? {});
});
