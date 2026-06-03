/**
 * Tenant-scoped repository base.
 *
 * Property 1 (tenant isolation) lives here: every read or write that needs
 * tenant scoping MUST be issued through `withTenant(tenantId)`. Higher-level
 * repos call back into the helpers below; services and route handlers MUST
 * NOT import drizzle-orm directly.
 */

import { and, eq, type SQL } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { getDb } from '@/lib/db/client';

export interface TenantQuery {
  readonly tenantId: string;
  readonly db: Db;
  /** Combine `tenant_id = ?` with any extra predicates. */
  scope(tenantPredicate: SQL, extra?: SQL): SQL;
}

/**
 * Returns a tenant-scoped query helper.
 *
 * Usage:
 *   const q = withTenant(tenantId);
 *   await q.db.select().from(t).where(q.scope(eq(t.tenantId, tenantId), eq(t.id, id)));
 *
 * The `scope()` helper takes the tenant_id predicate the caller built so the
 * type system enforces the column the caller actually has on the table.
 */
export function withTenant(tenantId: string): TenantQuery {
  return {
    tenantId,
    db: getDb(),
    scope(tenantPredicate, extra) {
      if (!extra) return tenantPredicate;
      return and(tenantPredicate, extra) as SQL;
    },
  };
}

/** Re-export common drizzle helpers so repos don't pull from drizzle directly. */
export { and, eq };
