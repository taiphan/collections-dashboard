/**
 * Test fixtures: seed two tenants with overlapping artifact names so cross-
 * tenant leakage shows up immediately if a repo or service forgets to scope.
 */

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/schema';

export interface SeededTenant {
  id: string;
  subdomain: string;
  adminUserId: string;
  workerUserId: string;
}

export async function seedTenant(subdomain: string): Promise<SeededTenant> {
  const db = getDb();
  const [tenant] = await db
    .insert(schema.tenants)
    .values({ subdomain, name: subdomain.toUpperCase() })
    .returning();

  const passwordHash = await bcrypt.hash('password123', 8);
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: `admin@${subdomain}.test`,
      passwordHash,
      displayName: `${subdomain} admin`,
    })
    .returning();
  const [worker] = await db
    .insert(schema.users)
    .values({
      email: `worker@${subdomain}.test`,
      passwordHash,
      displayName: `${subdomain} worker`,
    })
    .returning();

  await db.insert(schema.memberships).values([
    {
      tenantId: tenant!.id,
      userId: admin!.id,
      roles: ['platform_admin', 'app_designer', 'manager'],
    },
    {
      tenantId: tenant!.id,
      userId: worker!.id,
      roles: ['case_worker'],
    },
  ]);

  return {
    id: tenant!.id,
    subdomain,
    adminUserId: admin!.id,
    workerUserId: worker!.id,
  };
}

export async function clearAllTenants(): Promise<void> {
  const db = getDb();
  await db.delete(schema.tenants).where(eq(schema.tenants.subdomain, schema.tenants.subdomain));
}
