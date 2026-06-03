/**
 * Read the TenantContext attached by `proxy.ts` from request headers.
 *
 * Server components call `requireTenantContext()` via `next/headers`.
 * Route handlers receive `NextRequest` and can call `tenantContextFromRequest`.
 */

import { headers as nextHeaders } from 'next/headers';
import {
  ROLES_HEADER,
  SUBDOMAIN_HEADER,
  TENANT_HEADER,
  USER_HEADER,
  type TenantContext,
} from '@/lib/tenancy/types';
import { TenantUnresolvedError, UnauthorizedError } from '@/lib/auth/errors';

export async function requireTenantContext(): Promise<TenantContext> {
  const h = await nextHeaders();
  const tenantId = h.get(TENANT_HEADER);
  if (!tenantId) throw new TenantUnresolvedError();
  const subdomain = h.get(SUBDOMAIN_HEADER) ?? '';
  const userId = h.get(USER_HEADER);
  const roles = (h.get(ROLES_HEADER) ?? '').split(',').filter(Boolean);
  if (!userId) throw new UnauthorizedError();
  return { tenantId, subdomain, userId, roles };
}

export function tenantContextFromRequest(req: { headers: { get(name: string): string | null } }): TenantContext {
  const tenantId = req.headers.get(TENANT_HEADER);
  if (!tenantId) throw new TenantUnresolvedError();
  const subdomain = req.headers.get(SUBDOMAIN_HEADER) ?? '';
  const userId = req.headers.get(USER_HEADER);
  const roles = (req.headers.get(ROLES_HEADER) ?? '').split(',').filter(Boolean);
  if (!userId) throw new UnauthorizedError();
  return { tenantId, subdomain, userId, roles };
}
