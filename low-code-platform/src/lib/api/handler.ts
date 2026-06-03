/**
 * Shared route-handler helpers.
 *
 * Wraps a handler so any thrown HttpError converts cleanly via toHttpResponse,
 * and the tenant context is resolved once per request.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { tenantContextFromRequest } from '@/lib/tenancy/context';
import { toHttpResponse } from '@/lib/auth/errors';
import type { TenantContext } from '@/lib/tenancy/types';

type HandlerArg = { ctx: TenantContext; req: NextRequest };

export function withCtx<T>(
  fn: (arg: HandlerArg) => Promise<T>,
): (req: NextRequest) => Promise<NextResponse | Response> {
  return async (req) => {
    try {
      const ctx = tenantContextFromRequest(req);
      const result = await fn({ ctx, req });
      if (result instanceof Response) return result;
      return NextResponse.json(result);
    } catch (err) {
      return toHttpResponse(err);
    }
  };
}

export function withCtxAndParams<P, T>(
  fn: (arg: HandlerArg & { params: P }) => Promise<T>,
): (req: NextRequest, ctx: { params: Promise<P> }) => Promise<NextResponse | Response> {
  return async (req, routeCtx) => {
    try {
      const ctx = tenantContextFromRequest(req);
      const params = await routeCtx.params;
      const result = await fn({ ctx, req, params });
      if (result instanceof Response) return result;
      return NextResponse.json(result);
    } catch (err) {
      return toHttpResponse(err);
    }
  };
}
