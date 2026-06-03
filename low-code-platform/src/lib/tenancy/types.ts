/**
 * Tenant + auth context attached to every authenticated request.
 *
 * The `proxy.ts` middleware writes these onto request headers so server
 * components and route handlers downstream can read them via
 * `requireTenantContext()` without re-running tenant resolution.
 */

export interface TenantContext {
  /** UUID of the active tenant for this request. */
  tenantId: string;
  /** Subdomain that resolved to this tenant (informational). */
  subdomain: string;
  /** UUID of the authenticated user. May be null on public routes. */
  userId: string | null;
  /** Roles the user holds within the active tenant. */
  roles: string[];
}

export const TENANT_HEADER = 'x-lcp-tenant-id';
export const SUBDOMAIN_HEADER = 'x-lcp-tenant-subdomain';
export const USER_HEADER = 'x-lcp-user-id';
export const ROLES_HEADER = 'x-lcp-roles';

/** Header used in dev/test to opt into a tenant when no subdomain is present. */
export const DEV_TENANT_HEADER = 'X-Tenant-Id';

/** Server-readable cookie set when the user switches tenant in the UI (dev). */
export const ACTIVE_TENANT_COOKIE = 'lcp-active-tenant';
