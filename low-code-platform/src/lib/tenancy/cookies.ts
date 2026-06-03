import { ACTIVE_TENANT_COOKIE } from '@/lib/tenancy/types';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Cookie options for the active-tenant selector (dev / plain-host access). */
export function activeTenantCookieOptions(): {
  name: string;
  httpOnly: true;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
  secure: boolean;
} {
  return {
    name: ACTIVE_TENANT_COOKIE,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  };
}
