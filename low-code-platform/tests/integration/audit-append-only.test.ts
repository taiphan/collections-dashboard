/**
 * Property 3 — append-only audit.
 *
 * The trigger added in 0001_audit_log_append_only.sql must reject UPDATE and
 * DELETE statements on `audit_log`, and INSERT must succeed.
 */

import { describe, it, expect } from 'vitest';
import { setupTestDatabase } from './helpers/test-db';
import { seedTenant } from './helpers/fixtures';
import { getTestPool } from './helpers/test-db';

setupTestDatabase();

describe('Property 3 — append-only audit', () => {
  it('inserts succeed', async () => {
    const t = await seedTenant('audit_insert');
    const pool = getTestPool();
    const id = '00000000-0000-4000-8000-000000000abc';
    await pool.query(
      `INSERT INTO audit_log (tenant_id, actor_user_id, artifact_type, artifact_id, action)
       VALUES ($1, $2, 'entity', $3, 'create')`,
      [t.id, t.adminUserId, id],
    );
    const { rows } = await pool.query(`SELECT count(*)::int AS c FROM audit_log WHERE tenant_id = $1`, [t.id]);
    expect(rows[0].c).toBe(1);
  });

  it('UPDATE on audit_log is rejected by the trigger', async () => {
    const t = await seedTenant('audit_update');
    const pool = getTestPool();
    await pool.query(
      `INSERT INTO audit_log (tenant_id, actor_user_id, artifact_type, artifact_id, action)
       VALUES ($1, $2, 'entity', $3, 'create')`,
      [t.id, t.adminUserId, '00000000-0000-4000-8000-000000000111'],
    );
    await expect(
      pool.query(`UPDATE audit_log SET action = 'update' WHERE tenant_id = $1`, [t.id]),
    ).rejects.toThrow(/audit_log is append-only/i);
  });

  it('DELETE on audit_log is rejected by the trigger', async () => {
    const t = await seedTenant('audit_delete');
    const pool = getTestPool();
    await pool.query(
      `INSERT INTO audit_log (tenant_id, actor_user_id, artifact_type, artifact_id, action)
       VALUES ($1, $2, 'entity', $3, 'create')`,
      [t.id, t.adminUserId, '00000000-0000-4000-8000-000000000222'],
    );
    await expect(
      pool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [t.id]),
    ).rejects.toThrow(/audit_log is append-only/i);
  });
});
