import { withCtxAndParams } from '@/lib/api/handler';
import * as runtime from '@/lib/services/case-runtime';

export const GET = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, params }) =>
  runtime.getCaseDetail(ctx, params.id),
);
