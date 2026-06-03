/**
 * Property 2 — pinned design version.
 *
 * After a Case is created against case_type vN, republishing the case type as
 * vN+1 must NOT mutate the existing case's progression. The runtime resolves
 * its definition from `case_type_versions` keyed by (case_type_id, version)
 * captured at creation time.
 */

import { describe, it, expect } from 'vitest';
import { setupTestDatabase } from './helpers/test-db';
import { seedTenant } from './helpers/fixtures';
import * as dataModelService from '@/lib/services/data-model';
import * as formService from '@/lib/services/form-designer';
import * as caseDesignerService from '@/lib/services/case-designer';
import * as caseRuntime from '@/lib/services/case-runtime';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { TenantContext } from '@/lib/tenancy/types';

setupTestDatabase();

describe('Property 2 — pinned design version', () => {
  it('republishing a case type does not change an in-flight case', async () => {
    const t = await seedTenant('pinned_a');
    const ctx: TenantContext = {
      tenantId: t.id,
      subdomain: 'a',
      userId: t.adminUserId,
      roles: ['platform_admin', 'app_designer', 'manager', 'case_worker'],
    };

    // Set up entity → form → case type with one form_step.
    const entity = await dataModelService.createEntity(ctx, {
      name: 'profile',
      label: 'Profile',
      definition: {
        fields: [
          { id: '11111111-1111-4111-8111-111111111111', kind: 'text', name: 'name', label: 'Name', required: false },
        ],
        relationships: [],
      },
    });
    await dataModelService.publishEntity(ctx, entity.id, 1);

    const form = await formService.createForm(ctx, {
      name: 'profile_form',
      label: 'Profile form',
      definition: {
        entityId: entity.id,
        rootComponentIds: ['c1'],
        components: [
          { id: 'c1', kind: 'text_input', fieldPath: 'name', label: 'Name' },
        ],
      },
    });
    await formService.publishForm(ctx, form.id, 1);

    const v1Definition = {
      primaryEntityId: entity.id,
      stages: [
        {
          id: 'intake',
          name: 'Intake',
          steps: [
            {
              id: 'collect',
              name: 'Collect',
              kind: 'form_step',
              formId: form.id,
              assignment: { kind: 'specific_role', role: 'case_worker' },
            },
          ],
        },
      ],
    };

    const ct = await caseDesignerService.createCaseType(ctx, {
      name: 'profile_workflow',
      label: 'Profile workflow',
      definition: v1Definition,
    });
    await caseDesignerService.publishCaseType(ctx, ct.id, 1);

    // Create a case (pins to v1).
    const created = await caseRuntime.createCase(ctx, { caseTypeId: ct.id });

    // Republish a v2 with an extra step: would change behaviour if the case
    // wasn't pinned.
    const v2Definition = {
      ...v1Definition,
      stages: [
        v1Definition.stages[0],
        {
          id: 'extra_stage',
          name: 'Extra',
          steps: [{ id: 'extra_step', name: 'Extra', kind: 'automated_step' }],
        },
      ],
    };
    await caseDesignerService.updateCaseType(ctx, ct.id, v2Definition);
    await caseDesignerService.publishCaseType(ctx, ct.id, 2);

    // The existing case must still report case_type_version === 1.
    const db = getDb();
    const [row] = await db
      .select({ version: schema.cases.caseTypeVersion })
      .from(schema.cases)
      .where(eq(schema.cases.id, created.id))
      .limit(1);
    expect(row!.version).toBe(1);

    // Detail view should still resolve against the v1 definition (one stage,
    // one step), not v2 (two stages).
    const detail = await caseRuntime.getCaseDetail(ctx, created.id);
    expect(detail.definition.stages).toHaveLength(1);
    expect(detail.definition.stages[0]!.steps).toHaveLength(1);
  });
});
