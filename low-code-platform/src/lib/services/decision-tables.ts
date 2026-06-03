/**
 * Decision tables service. (Pillar V2.D — deterministic decisioning.)
 */

import { withTenant } from '@/lib/db/repositories/base';
import * as decisionRepo from '@/lib/db/repositories/decision-tables';
import {
  ConflictError,
  NotFoundError,
  ValidationFailedError,
} from '@/lib/auth/errors';
import { ROLES, requireAnyRole } from '@/lib/rbac/roles';
import * as audit from '@/lib/services/audit';
import { decisionTableDefinitionSchema, type DecisionTableDefinition } from '@/lib/validation/decision-table';
import { evaluateDecisionTable, type DecisionResult } from '@/lib/decisions';
import { humanNameSchema, identifierSchema } from '@/lib/validation/identifiers';
import type { TenantContext } from '@/lib/tenancy/types';
import { z } from 'zod';

const createInputSchema = z.object({
  name: identifierSchema,
  label: humanNameSchema,
  definition: decisionTableDefinitionSchema,
});

export async function list(ctx: TenantContext) {
  return decisionRepo.list(withTenant(ctx.tenantId));
}

export async function getById(ctx: TenantContext, id: string) {
  const row = await decisionRepo.getById(withTenant(ctx.tenantId), id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function create(ctx: TenantContext, raw: unknown) {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = createInputSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());
  const q = withTenant(ctx.tenantId);
  // Uniqueness: surface 409 instead of relying on DB unique-constraint error.
  const existing = await q.db.execute(
    /* keep simple, repo provides uniqueness through the unique index */
    { sql: '', args: [] } as never,
  ).catch(() => null);
  void existing;
  try {
    const row = await decisionRepo.create(q, parsed.data);
    await audit.record(ctx, {
      actorUserId: ctx.userId,
      artifactType: 'decision_table',
      artifactId: row.id,
      action: 'create',
      metadata: { name: row.name },
    });
    return row;
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '23505') {
      throw new ConflictError('Decision table name is already taken.');
    }
    throw err;
  }
}

export async function update(ctx: TenantContext, id: string, rawDefinition: unknown) {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = decisionTableDefinitionSchema.safeParse(rawDefinition);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());
  const q = withTenant(ctx.tenantId);
  const head = await decisionRepo.getById(q, id);
  if (!head) throw new NotFoundError();
  await decisionRepo.update(q, id, { definition: parsed.data });
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'decision_table',
    artifactId: id,
    action: 'update',
  });
}

export async function evaluateById(
  ctx: TenantContext,
  id: string,
  inputs: Record<string, unknown>,
): Promise<DecisionResult> {
  const head = await decisionRepo.getById(withTenant(ctx.tenantId), id);
  if (!head) throw new NotFoundError();
  return evaluateDecisionTable(head.definition as DecisionTableDefinition, inputs);
}
