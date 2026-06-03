/**
 * V2.H — release approval gate.
 *
 * A release with a `single` policy cannot be promoted until one approval
 * (from someone other than the author) is recorded. The author cannot
 * self-approve.
 */

import { describe, it, expect } from 'vitest';
import { setupTestDatabase } from './helpers/test-db';
import { seedTenant } from './helpers/fixtures';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/schema';
import * as dataModelService from '@/lib/services/data-model';
import * as releaseService from '@/lib/services/releases';
import { HttpError } from '@/lib/auth/errors';
import type { TenantContext } from '@/lib/tenancy/types';

setupTestDatabase();

async function addAdmin(tenantId: string, email: string): Promise<string> {
  const db = getDb();
  const passwordHash = await bcrypt.hash('password123', 8);
  const [u] = await db
    .insert(schema.users)
    .values({ email, passwordHash, displayName: email })
    .returning();
  await db.insert(schema.memberships).values({
    tenantId,
    userId: u!.id,
    roles: ['platform_admin'],
  });
  return u!.id;
}

describe('V2.H — release approval gate', () => {
  it('blocks promotion until approved, and forbids self-approval', async () => {
    const source = await seedTenant('rel_src');
    const target = await seedTenant('rel_tgt');
    const secondAdmin = await addAdmin(source.id, 'second-admin@rel.test');

    const authorCtx: TenantContext = {
      tenantId: source.id,
      subdomain: 'src',
      userId: source.adminUserId,
      roles: ['platform_admin', 'app_designer'],
    };
    const approverCtx: TenantContext = {
      tenantId: source.id,
      subdomain: 'src',
      userId: secondAdmin,
      roles: ['platform_admin'],
    };

    // Build a published entity to put in the release.
    const entity = await dataModelService.createEntity(authorCtx, {
      name: 'thing',
      label: 'Thing',
      definition: {
        fields: [
          { id: '11111111-1111-4111-8111-111111111111', kind: 'text', name: 'n', label: 'N', required: false },
        ],
        relationships: [],
      },
    });
    await dataModelService.publishEntity(authorCtx, entity.id, 1);

    const release = await releaseService.build(authorCtx, {
      name: 'rel_1',
      approvalPolicy: 'single',
      artifacts: [{ artifactType: 'entity', artifactId: entity.id }],
    });

    // Promotion before approval is blocked.
    await expect(
      releaseService.promote(authorCtx, release.id, { targetTenantId: target.id }),
    ).rejects.toBeInstanceOf(HttpError);

    // Author cannot self-approve.
    await expect(
      releaseService.decide(authorCtx, release.id, 'approve'),
    ).rejects.toBeInstanceOf(HttpError);

    // A different admin approves → status becomes approved.
    const result = await releaseService.decide(approverCtx, release.id, 'approve');
    expect(result.status).toBe('approved');
    expect(result.approvals).toBe(1);

    // Now promotion succeeds.
    const promoted = await releaseService.promote(authorCtx, release.id, {
      targetTenantId: target.id,
    });
    expect(promoted.promotedCount).toBe(1);

    // The entity now exists in the target tenant.
    const { withTenant } = await import('@/lib/db/repositories/base');
    const entityRepo = await import('@/lib/db/repositories/entities');
    const targetEntities = await entityRepo.listEntities(withTenant(target.id));
    expect(targetEntities.some((e) => e.name === 'thing')).toBe(true);
  });
});
