import { withCtx } from '@/lib/api/handler';
import * as service from '@/lib/services/form-designer';

export const GET = withCtx(async ({ ctx }) => service.listForms(ctx));

export const POST = withCtx(async ({ ctx, req }) => {
  const body = await req.json();
  return service.createForm(ctx, body);
});
