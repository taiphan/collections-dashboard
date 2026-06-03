/**
 * Property 9 — notification fan-out.
 *
 * When a step's assignment policy resolves to a role held by N users, exactly
 * N in-app notifications are produced for the assignment event, all scoped
 * to the same tenant.
 */

import bcrypt from 'bcryptjs';
import { describe, it, expect } from 'vitest';
import { setupTestDatabase, getTestPool } from './helpers/test-db';
import { seedTenant } from './helpers/fixtures';
import * as notifications from '@/lib/services/notifications';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/schema';
import type { TenantContext } from '@/lib/tenancy/types';

setupTestDatabase();

async function addCaseWorker(tenantId: string, email: string): Promise<string> {
  const db = getDb();
  const passwordHash = await bcrypt.hash('password123', 8);
  const [u] = await db
    .insert(schema.users)
    .values({ email, passwordHash, displayName: email })
    .returning();
  await db.insert(schema.memberships).values({
    tenantId,
    userId: u!.id,
    roles: ['case_worker'],
    emailPrefs: { assignments: true, sla: true, mentions: true },
  });
  return u!.id;
}

describe('Property 9 — notification fan-out', () => {
  it('produces one row per role member, all in the same tenant', async () => {
    const a = await seedTenant('fanout_a');
    const b = await seedTenant('fanout_b');

    // Add 3 more case_workers in tenant A and 1 in tenant B.
    const a2 = await addCaseWorker(a.id, 'a2@fanout.test');
    const a3 = await addCaseWorker(a.id, 'a3@fanout.test');
    const a4 = await addCaseWorker(a.id, 'a4@fanout.test');
    const b2 = await addCaseWorker(b.id, 'b2@fanout.test');

    const ctx: TenantContext = {
      tenantId: a.id,
      subdomain: 'a',
      userId: a.adminUserId,
      roles: ['platform_admin'],
    };

    await notifications.notify(ctx, {
      recipientRoles: ['case_worker'],
      kind: 'assignment',
      caseId: null,
      payload: { test: true },
    });

    const pool = getTestPool();
    const { rows: aRows } = await pool.query(
      `SELECT recipient_user_id FROM notifications WHERE tenant_id = $1`,
      [a.id],
    );
    const recipientIds = aRows.map((r) => r.recipient_user_id);
    // Tenant A has: original worker + a2 + a3 + a4 → 4 case_workers.
    expect(recipientIds).toHaveLength(4);
    expect(new Set(recipientIds).size).toBe(4);
    expect(recipientIds).toEqual(expect.arrayContaining([a.workerUserId, a2, a3, a4]));

    // Tenant B's case_worker must not receive a row.
    expect(recipientIds.includes(b2)).toBe(false);
    const { rows: bRows } = await pool.query(
      `SELECT count(*)::int AS c FROM notifications WHERE tenant_id = $1`,
      [b.id],
    );
    expect(bRows[0].c).toBe(0);
  });
});
