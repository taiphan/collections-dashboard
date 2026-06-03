import { withCtx } from '@/lib/api/handler';
import * as service from '@/lib/services/admin';

export const GET = withCtx(async ({ ctx }) => service.listTenantsAsAdmin(ctx));

export const POST = withCtx(async ({ ctx, req }) => {
  const body = (await req.json()) as { subdomain: string; name: string };
  return service.createTenant(ctx, body);
});
