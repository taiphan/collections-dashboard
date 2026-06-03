/**
 * Next.js 16 Proxy (formerly middleware).
 *
 * Responsibilities:
 *  - Resolve the active tenant from the request (subdomain in prod;
 *    X-Tenant-Id header allowed in dev only).
 *  - Read the NextAuth session and attach userId / roles for the active tenant
 *    so server components and route handlers don't re-resolve.
 *  - Redirect unauthenticated requests on private routes to /login.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { resolveTenant } from '@/lib/tenancy/resolver';
import * as tenantRepo from '@/lib/db/repositories/tenants';
import {
  ACTIVE_TENANT_COOKIE,
  ROLES_HEADER,
  SUBDOMAIN_HEADER,
  TENANT_HEADER,
  USER_HEADER,
} from '@/lib/tenancy/types';
import { activeTenantCookieOptions } from '@/lib/tenancy/cookies';
import { HttpError, ForbiddenError, TenantUnresolvedError } from '@/lib/auth/errors';

const TENANT_OPTIONAL_PATHS: readonly string[] = [
  '/login',
  '/signup',
  '/accept-invite',
  '/api/auth',
  '/api/health',
];

const PUBLIC_PATHS: readonly string[] = ['/', '/login', '/signup', '/accept-invite'];

function isTenantOptional(pathname: string): boolean {
  if (pathname === '/') return true;
  return TENANT_OPTIONAL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublic(pathname: string): boolean {
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname === '/api/health') return true;
  return PUBLIC_PATHS.includes(pathname);
}

const tenantLookup = {
  async bySubdomain(subdomain: string) {
    const t = await tenantRepo.getBySubdomain(subdomain);
    return t ? { id: t.id, subdomain: t.subdomain } : null;
  },
  async byId(id: string) {
    const t = await tenantRepo.getById(id);
    return t ? { id: t.id, subdomain: t.subdomain } : null;
  },
};

export async function proxy(req: NextRequest): Promise<NextResponse | undefined> {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return;
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId && !isPublic(pathname)) {
    // API clients get a 401 JSON; browser navigations get redirected to login.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'unauthorized', message: 'Authentication required.' } },
        { status: 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isTenantOptional(pathname)) {
    return;
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const requestLike = {
    url: req.url,
    headers: req.headers,
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value ?? null;
      },
    },
  };

  let fallbackTenantId: string | undefined;
  if (isDev && userId && session?.memberships?.length) {
    const cookieId = req.cookies.get(ACTIVE_TENANT_COOKIE)?.value;
    const memberIds = new Set(session.memberships.map((m) => m.tenantId));
    if (cookieId && memberIds.has(cookieId)) {
      fallbackTenantId = cookieId;
    } else if (session.memberships.length === 1) {
      fallbackTenantId = session.memberships[0]!.tenantId;
    }
  }

  try {
    const ctx = await resolveTenant(requestLike, tenantLookup, { fallbackTenantId });
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set(TENANT_HEADER, ctx.tenantId);
    reqHeaders.set(SUBDOMAIN_HEADER, ctx.subdomain);
    if (userId) {
      const membership = session?.memberships?.find((m) => m.tenantId === ctx.tenantId);
      if (!membership) {
        throw new ForbiddenError('You are not a member of this tenant.');
      }
      reqHeaders.set(USER_HEADER, userId);
      reqHeaders.set(ROLES_HEADER, membership.roles.join(','));
    } else {
      reqHeaders.set(ROLES_HEADER, '');
    }
    const res = NextResponse.next({ request: { headers: reqHeaders } });
    if (
      isDev &&
      userId &&
      fallbackTenantId === ctx.tenantId &&
      !req.cookies.get(ACTIVE_TENANT_COOKIE)?.value
    ) {
      const opts = activeTenantCookieOptions();
      res.cookies.set(opts.name, ctx.tenantId, {
        httpOnly: opts.httpOnly,
        sameSite: opts.sameSite,
        path: opts.path,
        maxAge: opts.maxAge,
        secure: opts.secure,
      });
    }
    return res;
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    const fallback = new TenantUnresolvedError();
    return NextResponse.json(
      { error: { code: fallback.code, message: fallback.message } },
      { status: fallback.status },
    );
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
