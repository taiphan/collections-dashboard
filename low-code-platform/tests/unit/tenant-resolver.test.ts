import { describe, it, expect } from 'vitest';
import {
  extractSubdomain,
  resolveTenant,
  type TenantLookup,
} from '@/lib/tenancy/resolver';
import {
  TenantConflictError,
  TenantUnresolvedError,
} from '@/lib/auth/errors';
import { ACTIVE_TENANT_COOKIE } from '@/lib/tenancy/types';

const acme = { id: '11111111-1111-4111-8111-111111111111', subdomain: 'acme' };
const beta = { id: '22222222-2222-4222-8222-222222222222', subdomain: 'beta' };

const lookup: TenantLookup = {
  bySubdomain: async (sub) => {
    if (sub === 'acme') return acme;
    if (sub === 'beta') return beta;
    return null;
  },
  byId: async (id) => {
    if (id === acme.id) return acme;
    if (id === beta.id) return beta;
    return null;
  },
};

function reqOf(
  host: string,
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
): {
  url: string;
  headers: { get(name: string): string | null };
  cookies: { get(name: string): string | null };
} {
  const merged: Record<string, string> = { host, ...headers };
  return {
    url: `https://${host}/some/path`,
    headers: {
      get(name) {
        const lower = name.toLowerCase();
        for (const [k, v] of Object.entries(merged)) {
          if (k.toLowerCase() === lower) return v;
        }
        return null;
      },
    },
    cookies: {
      get(name) {
        return cookies[name] ?? null;
      },
    },
  };
}

describe('extractSubdomain', () => {
  it('extracts subdomain from host', () => {
    expect(extractSubdomain('acme.lcp.localhost', 'lcp.localhost')).toBe('acme');
    expect(extractSubdomain('acme.lcp.localhost:3020', 'lcp.localhost')).toBe('acme');
    expect(extractSubdomain('lcp.localhost', 'lcp.localhost')).toBeNull();
    expect(extractSubdomain('www.lcp.localhost', 'lcp.localhost')).toBeNull();
    expect(extractSubdomain('foo.bar.com', 'lcp.localhost')).toBeNull();
  });
});

describe('resolveTenant', () => {
  it('resolves from subdomain in production mode', async () => {
    const result = await resolveTenant(reqOf('acme.lcp.localhost'), lookup, {
      isDevMode: () => false,
      rootDomain: 'lcp.localhost',
    });
    expect(result.tenantId).toBe(acme.id);
  });

  it('rejects header-only resolution in production mode', async () => {
    await expect(
      resolveTenant(reqOf('lcp.localhost', { 'X-Tenant-Id': acme.id }), lookup, {
        isDevMode: () => false,
        rootDomain: 'lcp.localhost',
      }),
    ).rejects.toBeInstanceOf(TenantUnresolvedError);
  });

  it('accepts header in dev mode when no subdomain resolves', async () => {
    const result = await resolveTenant(
      reqOf('lcp.localhost', { 'X-Tenant-Id': acme.id }),
      lookup,
      { isDevMode: () => true, rootDomain: 'lcp.localhost' },
    );
    expect(result.tenantId).toBe(acme.id);
  });

  it('rejects when subdomain and header conflict', async () => {
    await expect(
      resolveTenant(
        reqOf('acme.lcp.localhost', { 'X-Tenant-Id': beta.id }),
        lookup,
        { isDevMode: () => true, rootDomain: 'lcp.localhost' },
      ),
    ).rejects.toBeInstanceOf(TenantConflictError);
  });

  it('rejects when neither subdomain nor header resolves', async () => {
    await expect(
      resolveTenant(reqOf('lcp.localhost'), lookup, {
        isDevMode: () => true,
        rootDomain: 'lcp.localhost',
      }),
    ).rejects.toBeInstanceOf(TenantUnresolvedError);
  });

  it('rejects malformed UUID in dev header', async () => {
    await expect(
      resolveTenant(
        reqOf('lcp.localhost', { 'X-Tenant-Id': 'not-a-uuid' }),
        lookup,
        { isDevMode: () => true, rootDomain: 'lcp.localhost' },
      ),
    ).rejects.toBeInstanceOf(TenantUnresolvedError);
  });

  it('treats matching subdomain + header as success (no conflict)', async () => {
    const result = await resolveTenant(
      reqOf('acme.lcp.localhost', { 'X-Tenant-Id': acme.id }),
      lookup,
      { isDevMode: () => true, rootDomain: 'lcp.localhost' },
    );
    expect(result.tenantId).toBe(acme.id);
  });

  it('accepts active-tenant cookie in dev when host has no subdomain', async () => {
    const result = await resolveTenant(
      reqOf('lcp.localhost', {}, { [ACTIVE_TENANT_COOKIE]: acme.id }),
      lookup,
      { isDevMode: () => true, rootDomain: 'lcp.localhost' },
    );
    expect(result.tenantId).toBe(acme.id);
  });

  it('rejects when subdomain and cookie conflict', async () => {
    await expect(
      resolveTenant(
        reqOf('acme.lcp.localhost', {}, { [ACTIVE_TENANT_COOKIE]: beta.id }),
        lookup,
        { isDevMode: () => true, rootDomain: 'lcp.localhost' },
      ),
    ).rejects.toBeInstanceOf(TenantConflictError);
  });

  it('uses fallback tenant id in dev when nothing else resolves', async () => {
    const result = await resolveTenant(reqOf('lcp.localhost'), lookup, {
      isDevMode: () => true,
      rootDomain: 'lcp.localhost',
      fallbackTenantId: beta.id,
    });
    expect(result.tenantId).toBe(beta.id);
  });
});
