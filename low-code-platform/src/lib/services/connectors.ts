/**
 * Connectors service. Implements Pillar V2.E (REST adapter ships; others
 * surface `not_implemented`).
 */

import { z } from 'zod';
import { withTenant } from '@/lib/db/repositories/base';
import * as connectorRepo from '@/lib/db/repositories/connectors';
import {
  ConflictError,
  NotFoundError,
  ValidationFailedError,
} from '@/lib/auth/errors';
import { ROLES, requireAnyRole } from '@/lib/rbac/roles';
import { humanNameSchema, identifierSchema } from '@/lib/validation/identifiers';
import * as audit from '@/lib/services/audit';
import { getAdapter } from '@/lib/connectors/registry';
import type { ConnectorRequest, ConnectorResponse } from '@/lib/connectors/types';
import type { TenantContext } from '@/lib/tenancy/types';

const createInputSchema = z.object({
  name: identifierSchema,
  label: humanNameSchema,
  kind: z.enum(['rest', 'soap', 'db', 'file']),
  config: z.record(z.string(), z.unknown()).default({}),
  credentialRef: z.string().max(120).optional(),
});

export async function list(ctx: TenantContext) {
  return connectorRepo.list(withTenant(ctx.tenantId));
}

export async function getById(ctx: TenantContext, id: string) {
  const row = await connectorRepo.getById(withTenant(ctx.tenantId), id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function create(ctx: TenantContext, raw: unknown) {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = createInputSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());
  try {
    const row = await connectorRepo.create(withTenant(ctx.tenantId), parsed.data);
    await audit.record(ctx, {
      actorUserId: ctx.userId,
      artifactType: 'connector',
      artifactId: row.id,
      action: 'create',
      metadata: { name: row.name, kind: row.kind },
    });
    return row;
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '23505') {
      throw new ConflictError('Connector name is already taken.');
    }
    throw err;
  }
}

export async function invokeById(
  ctx: TenantContext,
  id: string,
  request: ConnectorRequest,
): Promise<ConnectorResponse> {
  const conn = await connectorRepo.getById(withTenant(ctx.tenantId), id);
  if (!conn) throw new NotFoundError();
  const adapter = getAdapter(conn.kind);
  return adapter.invoke(conn.config, conn.credentialRef, request);
}
