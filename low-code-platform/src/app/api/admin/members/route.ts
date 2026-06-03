import { withCtx } from '@/lib/api/handler';
import * as service from '@/lib/services/admin';

export const GET = withCtx(async ({ ctx }) => service.listMembersAsAdmin(ctx));

export const POST = withCtx(async ({ ctx, req }) => {
  const body = (await req.json()) as {
    email: string;
    password: string;
    displayName: string;
    roles: string[];
  };
  return service.inviteUser(ctx, body);
});
