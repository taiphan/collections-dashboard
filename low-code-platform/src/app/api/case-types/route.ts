import { withCtx } from '@/lib/api/handler';
import * as service from '@/lib/services/case-designer';

export const GET = withCtx(async ({ ctx }) => service.listCaseTypes(ctx));

export const POST = withCtx(async ({ ctx, req }) => {
  const body = await req.json();
  return service.createCaseType(ctx, body);
});
