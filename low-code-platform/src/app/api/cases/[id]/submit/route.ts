import { withCtxAndParams } from '@/lib/api/handler';
import * as runtime from '@/lib/services/case-runtime';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  const body = (await req.json()) as { fieldValues: Record<string, unknown> };
  return runtime.submitFormStep(ctx, { caseId: params.id, fieldValues: body.fieldValues });
});
