/**
 * Property 10 — attachment tenant-prefix.
 *
 * Every Attachment.storage_key MUST begin with `tenants/<tenant_id>/...`
 * matching the row's tenant_id.
 */

import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, getTestPool } from './helpers/test-db';
import { seedTenant } from './helpers/fixtures';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/schema';
import * as attachmentService from '@/lib/services/attachments';
import type { TenantContext } from '@/lib/tenancy/types';

setupTestDatabase();

let storageDir: string;

beforeAll(async () => {
  storageDir = await mkdtemp(path.join(os.tmpdir(), 'lcp-storage-'));
  process.env.STORAGE_DRIVER = 'local-fs';
  process.env.STORAGE_LOCAL_PATH = storageDir;
  process.env.ATTACHMENT_MAX_BYTES = String(1024 * 1024);
  process.env.ATTACHMENT_ALLOWED_TYPES = 'text/plain,application/pdf';
});

afterAll(async () => {
  await rm(storageDir, { recursive: true, force: true });
});

async function makeCase(tenantId: string, ownerUserId: string): Promise<string> {
  const db = getDb();
  const [entity] = await db
    .insert(schema.entities)
    .values({ tenantId, name: `e${Math.random()}`.replace('.', ''), label: 'e' })
    .returning();
  const [ct] = await db
    .insert(schema.caseTypes)
    .values({
      tenantId,
      name: `ct${Math.random()}`.replace('.', ''),
      label: 'ct',
      primaryEntityId: entity!.id,
    })
    .returning();
  const [c] = await db
    .insert(schema.cases)
    .values({
      tenantId,
      caseTypeId: ct!.id,
      caseTypeVersion: 1,
      identifier: `IDENT-${Math.random()}`.slice(0, 30),
      currentStageId: 's1',
      currentStepId: 'p1',
      currentAssigneeUserId: ownerUserId,
      stageEnteredAt: new Date(),
      caseEnteredAt: new Date(),
      primaryEntityData: {},
      createdBy: ownerUserId,
    })
    .returning();
  return c!.id;
}

describe('Property 10 — attachment tenant-prefix', () => {
  it('every storage_key starts with tenants/<tenantId>/', async () => {
    const a = await seedTenant('att_a');
    const b = await seedTenant('att_b');

    const aCaseId = await makeCase(a.id, a.adminUserId);
    const bCaseId = await makeCase(b.id, b.adminUserId);

    const aCtx: TenantContext = {
      tenantId: a.id,
      subdomain: 'a',
      userId: a.adminUserId,
      roles: ['manager', 'platform_admin'],
    };
    const bCtx: TenantContext = {
      tenantId: b.id,
      subdomain: 'b',
      userId: b.adminUserId,
      roles: ['manager', 'platform_admin'],
    };

    const aRow = await attachmentService.upload(aCtx, aCaseId, {
      filename: 'a.txt',
      contentType: 'text/plain',
      bytes: new TextEncoder().encode('hello a'),
    });
    const bRow = await attachmentService.upload(bCtx, bCaseId, {
      filename: 'b.txt',
      contentType: 'text/plain',
      bytes: new TextEncoder().encode('hello b'),
    });

    expect(aRow.storageKey.startsWith(`tenants/${a.id}/`)).toBe(true);
    expect(bRow.storageKey.startsWith(`tenants/${b.id}/`)).toBe(true);

    // Audit-style sanity check: every storage_key in the DB is consistent
    // with its row's tenant_id.
    const pool = getTestPool();
    const { rows } = await pool.query<{ tenant_id: string; storage_key: string }>(
      `SELECT tenant_id, storage_key FROM attachments`,
    );
    for (const r of rows) {
      expect(r.storage_key.startsWith(`tenants/${r.tenant_id}/`)).toBe(true);
    }
  });
});
