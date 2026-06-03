/**
 * Property 1 — tenant isolation.
 *
 * Two tenants are seeded with overlapping artifact names. Every read or write
 * issued through repositories or services scoped to tenant A must never
 * surface tenant B's rows.
 */

import { describe, it, expect } from 'vitest';
import { setupTestDatabase } from './helpers/test-db';
import { seedTenant } from './helpers/fixtures';
import { withTenant } from '@/lib/db/repositories/base';
import * as entityRepo from '@/lib/db/repositories/entities';
import * as auditRepo from '@/lib/db/repositories/audit';
import * as caseRepo from '@/lib/db/repositories/cases';
import * as dataModelService from '@/lib/services/data-model';
import type { TenantContext } from '@/lib/tenancy/types';

setupTestDatabase();

function ctxFor(tenantId: string, userId: string, roles: string[]): TenantContext {
  return { tenantId, subdomain: 'test', userId, roles };
}

describe('Property 1 — tenant isolation', () => {
  it('repos return zero cross-tenant rows when scoped via withTenant', async () => {
    const acme = await seedTenant('acme1');
    const beta = await seedTenant('beta1');

    const acmeCtx = ctxFor(acme.id, acme.adminUserId, ['app_designer', 'platform_admin']);
    const betaCtx = ctxFor(beta.id, beta.adminUserId, ['app_designer', 'platform_admin']);

    // Identical entity name in both tenants.
    await dataModelService.createEntity(acmeCtx, {
      name: 'customer',
      label: 'Customer',
      definition: {
        fields: [
          { id: '11111111-1111-4111-8111-111111111111', kind: 'text', name: 'first_name', label: 'First', required: false },
        ],
        relationships: [],
      },
    });
    await dataModelService.createEntity(betaCtx, {
      name: 'customer',
      label: 'Customer',
      definition: {
        fields: [
          { id: '22222222-2222-4222-8222-222222222222', kind: 'text', name: 'last_name', label: 'Last', required: false },
        ],
        relationships: [],
      },
    });

    const acmeEntities = await entityRepo.listEntities(withTenant(acme.id));
    const betaEntities = await entityRepo.listEntities(withTenant(beta.id));

    expect(acmeEntities).toHaveLength(1);
    expect(betaEntities).toHaveLength(1);
    expect(acmeEntities[0]!.tenantId).toBe(acme.id);
    expect(betaEntities[0]!.tenantId).toBe(beta.id);

    // getEntity scoped to acme cannot fetch beta's entity.
    const wrong = await entityRepo.getEntity(withTenant(acme.id), betaEntities[0]!.id);
    expect(wrong).toBeNull();
  });

  it('worklist queries do not leak across tenants', async () => {
    const a = await seedTenant('isol_a');
    const b = await seedTenant('isol_b');

    // Direct insert via repo to skip the runtime (we're validating the repo).
    const { getDb } = await import('@/lib/db/client');
    const { schema } = await import('@/lib/db/schema');
    const db = getDb();

    // Fake a case_type so cases reference a real id (foreign key satisfaction).
    const [aEntity] = await db
      .insert(schema.entities)
      .values({ tenantId: a.id, name: 'e', label: 'e' })
      .returning();
    const [bEntity] = await db
      .insert(schema.entities)
      .values({ tenantId: b.id, name: 'e', label: 'e' })
      .returning();
    const [aCt] = await db
      .insert(schema.caseTypes)
      .values({ tenantId: a.id, name: 'ct', label: 'ct', primaryEntityId: aEntity!.id })
      .returning();
    const [bCt] = await db
      .insert(schema.caseTypes)
      .values({ tenantId: b.id, name: 'ct', label: 'ct', primaryEntityId: bEntity!.id })
      .returning();

    await caseRepo.createCase(withTenant(a.id), {
      caseTypeId: aCt!.id,
      caseTypeVersion: 1,
      identifier: 'A-1',
      currentStageId: 's1',
      currentStepId: 'p1',
      currentAssigneeUserId: a.workerUserId,
      currentAssigneeRole: null,
      primaryEntityData: {},
      createdBy: a.adminUserId,
    });
    await caseRepo.createCase(withTenant(b.id), {
      caseTypeId: bCt!.id,
      caseTypeVersion: 1,
      identifier: 'B-1',
      currentStageId: 's1',
      currentStepId: 'p1',
      currentAssigneeUserId: b.workerUserId,
      currentAssigneeRole: null,
      primaryEntityData: {},
      createdBy: b.adminUserId,
    });

    const aPage = await caseRepo.listForWorklist(withTenant(a.id), { limit: 50 });
    const bPage = await caseRepo.listForWorklist(withTenant(b.id), { limit: 50 });
    expect(aPage.rows).toHaveLength(1);
    expect(aPage.rows[0]!.identifier).toBe('A-1');
    expect(bPage.rows).toHaveLength(1);
    expect(bPage.rows[0]!.identifier).toBe('B-1');
  });

  it('audit reads are scoped to the requesting tenant', async () => {
    const a = await seedTenant('audit_a');
    const b = await seedTenant('audit_b');

    const aCtx = ctxFor(a.id, a.adminUserId, ['platform_admin', 'manager']);

    // Emit an audit event in each tenant.
    await auditRepo.record(withTenant(a.id), {
      actorUserId: a.adminUserId,
      artifactType: 'entity',
      artifactId: '00000000-0000-4000-8000-000000000001',
      action: 'create',
    });
    await auditRepo.record(withTenant(b.id), {
      actorUserId: b.adminUserId,
      artifactType: 'entity',
      artifactId: '00000000-0000-4000-8000-000000000002',
      action: 'create',
    });

    const aRows = await auditRepo.query(withTenant(aCtx.tenantId), {});
    expect(aRows.every((r) => r.tenantId === a.id)).toBe(true);
    expect(aRows.length).toBeGreaterThanOrEqual(1);
  });
});
