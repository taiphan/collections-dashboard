/**
 * Data Model service.
 *
 * Implements Requirement 3:
 *  - create / update entities with versioned snapshots
 *  - publish a version (head row's `published_version` pointer)
 *  - delete-field integrity check against published forms / case types
 *
 * All persistence calls go through tenant-scoped repos (Property 1).
 * All mutations emit audit entries (Requirement 10.1).
 */

import { withTenant } from '@/lib/db/repositories/base';
import * as entityRepo from '@/lib/db/repositories/entities';
import * as formRepo from '@/lib/db/repositories/forms';
import * as caseTypeRepo from '@/lib/db/repositories/case-types';
import {
  ConflictError,
  NotFoundError,
  ValidationFailedError,
} from '@/lib/auth/errors';
import { ROLES, requireAnyRole } from '@/lib/rbac/roles';
import type { TenantContext } from '@/lib/tenancy/types';
import {
  createEntityInputSchema,
  entityDefinitionSchema,
  type CreateEntityInput,
  type EntityDefinition,
  type FieldDefinition,
} from '@/lib/validation/entity';
import * as audit from '@/lib/services/audit';

export interface EntitySummary {
  id: string;
  name: string;
  label: string;
  publishedVersion: number | null;
  updatedAt: Date;
}

export async function listEntities(ctx: TenantContext): Promise<EntitySummary[]> {
  const q = withTenant(ctx.tenantId);
  const rows = await entityRepo.listEntities(q);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    label: r.label,
    publishedVersion: r.publishedVersion,
    updatedAt: r.updatedAt,
  }));
}

export async function getEntity(
  ctx: TenantContext,
  id: string,
): Promise<{ summary: EntitySummary; latestDefinition: EntityDefinition | null; publishedDefinition: EntityDefinition | null }> {
  const q = withTenant(ctx.tenantId);
  const row = await entityRepo.getEntity(q, id);
  if (!row) throw new NotFoundError();
  const versions = await entityRepo.listVersions(q, id);
  const latest = versions[versions.length - 1];
  const published = row.publishedVersion
    ? versions.find((v) => v.version === row.publishedVersion) ?? null
    : null;
  return {
    summary: {
      id: row.id,
      name: row.name,
      label: row.label,
      publishedVersion: row.publishedVersion,
      updatedAt: row.updatedAt,
    },
    latestDefinition: latest ? (latest.definition as EntityDefinition) : null,
    publishedDefinition: published ? (published.definition as EntityDefinition) : null,
  };
}

export async function createEntity(
  ctx: TenantContext,
  raw: unknown,
): Promise<EntitySummary> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = createEntityInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationFailedError(parsed.error.flatten());
  }
  const input: CreateEntityInput = parsed.data;

  const q = withTenant(ctx.tenantId);
  const existing = await entityRepo.getEntityByName(q, input.name);
  if (existing) throw new ConflictError(`Entity name "${input.name}" is already taken.`);

  const { entity, version } = await entityRepo.createEntity(q, {
    name: input.name,
    label: input.label,
    definition: input.definition,
    createdBy: ctx.userId!,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'entity',
    artifactId: entity.id,
    action: 'create',
    afterRef: `entity_versions/${version.id}`,
    metadata: { name: entity.name, version: version.version },
  });

  return {
    id: entity.id,
    name: entity.name,
    label: entity.label,
    publishedVersion: entity.publishedVersion,
    updatedAt: entity.updatedAt,
  };
}

export async function updateEntity(
  ctx: TenantContext,
  id: string,
  rawDefinition: unknown,
): Promise<{ version: number }> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = entityDefinitionSchema.safeParse(rawDefinition);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());

  const q = withTenant(ctx.tenantId);
  const head = await entityRepo.getEntity(q, id);
  if (!head) throw new NotFoundError();

  const v = await entityRepo.appendEntityVersion(q, {
    entityId: id,
    definition: parsed.data,
    createdBy: ctx.userId!,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'entity',
    artifactId: id,
    action: 'update',
    afterRef: `entity_versions/${v.id}`,
    metadata: { version: v.version },
  });

  return { version: v.version };
}

export async function publishEntity(
  ctx: TenantContext,
  id: string,
  version: number,
): Promise<void> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const q = withTenant(ctx.tenantId);
  const head = await entityRepo.getEntity(q, id);
  if (!head) throw new NotFoundError();
  const v = await entityRepo.getEntityVersion(q, id, version);
  if (!v) throw new NotFoundError(`Entity version ${version} not found.`);

  await entityRepo.publishEntity(q, id, version);

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'entity',
    artifactId: id,
    action: 'publish',
    afterRef: `entity_versions/${v.id}`,
    metadata: { version },
  });
}

/**
 * Delete a field on the latest version. Rejected if any published Form or
 * Case_Type version references the field (Requirement 3.8).
 *
 * MVP scope: this performs a textual scan of the JSONB definitions. Sufficient
 * for the field types we ship; a future indexed reference table can replace
 * the scan when integrations / decisions arrive.
 */
export async function deleteFieldOnLatest(
  ctx: TenantContext,
  entityId: string,
  fieldName: string,
): Promise<{ version: number }> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const q = withTenant(ctx.tenantId);
  const head = await entityRepo.getEntity(q, entityId);
  if (!head) throw new NotFoundError();

  const versions = await entityRepo.listVersions(q, entityId);
  const latest = versions[versions.length - 1];
  if (!latest) throw new NotFoundError();
  const def = latest.definition as EntityDefinition;
  const fieldExists = def.fields.some((f: FieldDefinition) => f.name === fieldName);
  if (!fieldExists) {
    throw new ValidationFailedError({
      formErrors: [`Field "${fieldName}" does not exist on this entity.`],
    });
  }

  // Reference check: any published form or case-type version that mentions
  // the field path or this entity by name.
  const blockers: Array<{ artifactType: string; artifactId: string; name: string }> = [];

  const allForms = await formRepo.listForms(q);
  for (const f of allForms) {
    if (f.publishedVersion == null) continue;
    if (f.entityId !== entityId) continue;
    const v = await formRepo.getFormVersion(q, f.id, f.publishedVersion);
    if (!v) continue;
    if (JSON.stringify(v.definition).includes(`"fieldPath":"${fieldName}"`)) {
      blockers.push({ artifactType: 'form', artifactId: f.id, name: f.name });
    }
  }

  const allCaseTypes = await caseTypeRepo.listCaseTypes(q);
  for (const ct of allCaseTypes) {
    if (ct.publishedVersion == null) continue;
    if (ct.primaryEntityId !== entityId) continue;
    const v = await caseTypeRepo.getCaseTypeVersion(q, ct.id, ct.publishedVersion);
    if (!v) continue;
    if (JSON.stringify(v.definition).includes(`"path":"${fieldName}"`)) {
      blockers.push({ artifactType: 'case_type', artifactId: ct.id, name: ct.name });
    }
  }

  if (blockers.length > 0) {
    throw new ConflictError(
      `Field "${fieldName}" is referenced by published artifacts and cannot be deleted.`,
    );
  }

  const newDef: EntityDefinition = {
    ...def,
    fields: def.fields.filter((f) => f.name !== fieldName),
  };
  const v = await entityRepo.appendEntityVersion(q, {
    entityId,
    definition: newDef,
    createdBy: ctx.userId!,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'entity',
    artifactId: entityId,
    action: 'update',
    afterRef: `entity_versions/${v.id}`,
    metadata: { deletedField: fieldName, version: v.version },
  });

  return { version: v.version };
}
