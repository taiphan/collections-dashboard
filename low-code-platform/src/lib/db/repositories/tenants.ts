/**
 * Tenant repo. Tenant rows themselves are NOT tenant-scoped.
 */

import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { tenants } from '@/lib/db/schema';

export interface TenantRow {
  id: string;
  subdomain: string;
  name: string;
  designTokens?: unknown;
}

export async function getBySubdomain(subdomain: string): Promise<TenantRow | null> {
  const rows = await getDb()
    .select({
      id: tenants.id,
      subdomain: tenants.subdomain,
      name: tenants.name,
      designTokens: tenants.designTokens,
    })
    .from(tenants)
    .where(eq(tenants.subdomain, subdomain.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getById(id: string): Promise<TenantRow | null> {
  const rows = await getDb()
    .select({
      id: tenants.id,
      subdomain: tenants.subdomain,
      name: tenants.name,
      designTokens: tenants.designTokens,
    })
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function create(input: { subdomain: string; name: string }): Promise<TenantRow> {
  const rows = await getDb()
    .insert(tenants)
    .values({ subdomain: input.subdomain.toLowerCase(), name: input.name })
    .returning({ id: tenants.id, subdomain: tenants.subdomain, name: tenants.name });
  return rows[0]!;
}

export async function listAll(): Promise<TenantRow[]> {
  return getDb()
    .select({ id: tenants.id, subdomain: tenants.subdomain, name: tenants.name })
    .from(tenants);
}

export async function updateDesignTokens(id: string, tokens: unknown): Promise<void> {
  await getDb()
    .update(tenants)
    .set({ designTokens: tokens as object })
    .where(eq(tenants.id, id));
}
