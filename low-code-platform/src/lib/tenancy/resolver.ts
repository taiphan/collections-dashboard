/**
 * Tenant resolution.
 *
 * Production: subdomain only (Requirement 1.2).
 * Dev/test: subdomain when present, X-Tenant-Id header otherwise (Requirement 1.3).
 * Conflict between the two raises a TenantConflictError (Requirement 1.4).
 *
 * This module deliberately accepts a thin `RequestLike` interface so the same
 * code can be unit-tested without booting Next.js.
 */

import {
  TenantConflictError,
  TenantUnresolvedError,
} from '@/lib/auth/errors';
import { ACTIVE_TENANT_COOKIE, DEV_TENANT_HEADER } from '@/lib/tenancy/types';

export interface RequestLike {
  url: string;
  headers: { get(name: string): string | null };
  cookies?: { get(name: string): string | null };
}

export interface TenantLookup {
  /** Resolve a subdomain to a tenant id. Returns null when no tenant matches. */
  bySubdomain(subdomain: string): Promise<{ id: string; subdomain: string } | null>;
  /** Resolve a tenant id to a tenant. Returns null when not found. */
  byId(id: string): Promise<{ id: string; subdomain: string } | null>;
}

export interface ResolveTenantOptions {
  /**
   * Returns true when the resolver should accept the dev-only X-Tenant-Id
   * header. Defaults to `process.env.NODE_ENV !== 'production'`.
   */
  isDevMode?: () => boolean;
  /**
   * Root domain (e.g. `lcp.localhost`). Subdomains are extracted as
   * everything before the root. Defaults to PLATFORM_ROOT_DOMAIN env var.
   */
  rootDomain?: string;
  /**
   * Dev-only: when subdomain/header/cookie did not resolve, use this tenant id
   * (e.g. the user's sole membership or cookie-matched membership).
   */
  fallbackTenantId?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function extractSubdomain(host: string, rootDomain: string): string | null {
  if (!host || !rootDomain) return null;
  // Strip port if present.
  const hostname = host.split(':')[0]!.toLowerCase();
  const root = rootDomain.toLowerCase();
  if (hostname === root) return null;
  if (!hostname.endsWith(`.${root}`)) return null;
  const sub = hostname.slice(0, hostname.length - root.length - 1);
  // Reject empty or wildcards-style subdomains.
  if (!sub || sub === 'www') return null;
  return sub;
}

export async function resolveTenant(
  req: RequestLike,
  lookup: TenantLookup,
  opts: ResolveTenantOptions = {},
): Promise<{ tenantId: string; subdomain: string }> {
  const isDev = opts.isDevMode ? opts.isDevMode() : process.env.NODE_ENV !== 'production';
  const rootDomain = opts.rootDomain ?? process.env.PLATFORM_ROOT_DOMAIN ?? 'lcp.localhost';

  const host = req.headers.get('host') ?? new URL(req.url).host;
  const subdomain = extractSubdomain(host, rootDomain);

  let resolvedFromSubdomain: { id: string; subdomain: string } | null = null;
  if (subdomain) {
    resolvedFromSubdomain = await lookup.bySubdomain(subdomain);
  }

  // Dev-only fallback: X-Tenant-Id header or active-tenant cookie.
  let resolvedFromHeader: { id: string; subdomain: string } | null = null;
  let resolvedFromCookie: { id: string; subdomain: string } | null = null;
  if (isDev) {
    const headerId = req.headers.get(DEV_TENANT_HEADER) ?? req.headers.get(DEV_TENANT_HEADER.toLowerCase());
    if (headerId) {
      if (!UUID_RE.test(headerId)) {
        throw new TenantUnresolvedError();
      }
      resolvedFromHeader = await lookup.byId(headerId);
    }
    const cookieId = req.cookies?.get(ACTIVE_TENANT_COOKIE) ?? null;
    if (cookieId) {
      if (!UUID_RE.test(cookieId)) {
        throw new TenantUnresolvedError();
      }
      resolvedFromCookie = await lookup.byId(cookieId);
    }
  }

  const candidates = [resolvedFromSubdomain, resolvedFromHeader, resolvedFromCookie].filter(
    (r): r is { id: string; subdomain: string } => r !== null,
  );
  if (candidates.length > 1) {
    const uniqueIds = new Set(candidates.map((c) => c.id));
    if (uniqueIds.size > 1) {
      throw new TenantConflictError();
    }
  }

  let resolved = resolvedFromSubdomain ?? resolvedFromHeader ?? resolvedFromCookie;

  if (!resolved && isDev && opts.fallbackTenantId && UUID_RE.test(opts.fallbackTenantId)) {
    resolved = await lookup.byId(opts.fallbackTenantId);
  }

  if (!resolved) {
    throw new TenantUnresolvedError();
  }

  return { tenantId: resolved.id, subdomain: resolved.subdomain };
}
