import { withCtxAndParams } from '@/lib/api/handler';
import { ROLES, requireAnyRole } from '@/lib/rbac/roles';
import * as service from '@/lib/services/connectors';
import type { ConnectorRequest } from '@/lib/connectors/types';

export const POST = withCtxAndParams<{ id: string }, unknown>(async ({ ctx, req, params }) => {
  // Manual invocation is for App_Designers debugging connectors. Case runtime
  // calls the service directly with full context.
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN, ROLES.MANAGER]);
  const body = (await req.json()) as ConnectorRequest;
  return service.invokeById(ctx, params.id, body);
});
