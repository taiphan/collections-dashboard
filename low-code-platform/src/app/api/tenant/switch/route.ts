import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { ForbiddenError, UnauthorizedError, toHttpResponse } from '@/lib/auth/errors';
import * as tenantsRepo from '@/lib/db/repositories/tenants';
import { activeTenantCookieOptions } from '@/lib/tenancy/cookies';

const bodySchema = z.object({
  tenantId: z.string().uuid(),
});

/**
 * Sets the active-tenant cookie after verifying membership (Requirement 1.9).
 * In production, clients should navigate to the tenant subdomain instead.
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json(
        { error: { code: 'validation_failed', message: 'Invalid tenant id.', details: parsed.error.flatten() } },
        { status: 422 },
      );
    }

    const membership = session.memberships.find((m) => m.tenantId === parsed.data.tenantId);
    if (!membership) {
      throw new ForbiddenError('You are not a member of that tenant.');
    }

    const tenant = await tenantsRepo.getById(parsed.data.tenantId);
    if (!tenant) {
      throw new ForbiddenError('You are not a member of that tenant.');
    }

    const opts = activeTenantCookieOptions();
    const res = NextResponse.json({
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      name: tenant.name,
    });
    res.cookies.set(opts.name, tenant.id, {
      httpOnly: opts.httpOnly,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
      secure: opts.secure,
    });
    return res;
  } catch (err) {
    return toHttpResponse(err);
  }
}
