/**
 * Form Designer service. Implements Requirement 5.
 *
 * Persists FormDefinition versions, validates structural well-formedness via
 * Zod, and cross-checks component-to-field-type compatibility against the
 * bound entity (Property 7) before each save.
 */

import { withTenant } from '@/lib/db/repositories/base';
import * as formRepo from '@/lib/db/repositories/forms';
import * as entityRepo from '@/lib/db/repositories/entities';
import {
  ConflictError,
  NotFoundError,
  ValidationFailedError,
} from '@/lib/auth/errors';
import { ROLES, requireAnyRole } from '@/lib/rbac/roles';
import type { TenantContext } from '@/lib/tenancy/types';
import {
  createFormInputSchema,
  formDefinitionSchema,
  validateFormAgainstEntity,
  type CreateFormInput,
  type FormDefinition,
} from '@/lib/validation/form';
import type { EntityDefinition } from '@/lib/validation/entity';
import * as audit from '@/lib/services/audit';

export interface FormSummary {
  id: string;
  name: string;
  label: string;
  entityId: string;
  publishedVersion: number | null;
  updatedAt: Date;
}

async function loadEntityDefinition(
  ctx: TenantContext,
  entityId: string,
): Promise<EntityDefinition> {
  const q = withTenant(ctx.tenantId);
  const entity = await entityRepo.getEntity(q, entityId);
  if (!entity) {
    throw new ValidationFailedError({ formErrors: ['Bound entity does not exist.'] });
  }
  const versions = await entityRepo.listVersions(q, entityId);
  const latest = versions[versions.length - 1];
  if (!latest) {
    throw new ValidationFailedError({ formErrors: ['Bound entity has no versions yet.'] });
  }
  return latest.definition as EntityDefinition;
}

export async function listForms(ctx: TenantContext): Promise<FormSummary[]> {
  const q = withTenant(ctx.tenantId);
  const rows = await formRepo.listForms(q);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    label: r.label,
    entityId: r.entityId,
    publishedVersion: r.publishedVersion,
    updatedAt: r.updatedAt,
  }));
}

export async function getForm(
  ctx: TenantContext,
  id: string,
): Promise<{
  summary: FormSummary;
  latestDefinition: FormDefinition | null;
  publishedDefinition: FormDefinition | null;
}> {
  const q = withTenant(ctx.tenantId);
  const head = await formRepo.getForm(q, id);
  if (!head) throw new NotFoundError();
  const versions = await formRepo.listVersions(q, id);
  const latest = versions[versions.length - 1];
  const published = head.publishedVersion
    ? versions.find((v) => v.version === head.publishedVersion) ?? null
    : null;
  return {
    summary: {
      id: head.id,
      name: head.name,
      label: head.label,
      entityId: head.entityId,
      publishedVersion: head.publishedVersion,
      updatedAt: head.updatedAt,
    },
    latestDefinition: latest ? (latest.definition as FormDefinition) : null,
    publishedDefinition: published ? (published.definition as FormDefinition) : null,
  };
}

export async function createForm(ctx: TenantContext, raw: unknown): Promise<FormSummary> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = createFormInputSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());
  const input: CreateFormInput = parsed.data;

  const entityDef = await loadEntityDefinition(ctx, input.definition.entityId);
  const issues = validateFormAgainstEntity(input.definition, entityDef.fields);
  if (issues.length > 0) {
    throw new ValidationFailedError({ componentIssues: issues });
  }

  const q = withTenant(ctx.tenantId);
  const existing = await formRepo.getFormByName(q, input.name);
  if (existing) throw new ConflictError(`Form name "${input.name}" is already taken.`);

  const { form, version } = await formRepo.createForm(q, {
    name: input.name,
    label: input.label,
    entityId: input.definition.entityId,
    definition: input.definition,
    createdBy: ctx.userId!,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'form',
    artifactId: form.id,
    action: 'create',
    afterRef: `form_versions/${version.id}`,
    metadata: { name: form.name, version: version.version },
  });

  return {
    id: form.id,
    name: form.name,
    label: form.label,
    entityId: form.entityId,
    publishedVersion: form.publishedVersion,
    updatedAt: form.updatedAt,
  };
}

export async function updateForm(
  ctx: TenantContext,
  id: string,
  rawDefinition: unknown,
): Promise<{ version: number }> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = formDefinitionSchema.safeParse(rawDefinition);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());

  const q = withTenant(ctx.tenantId);
  const head = await formRepo.getForm(q, id);
  if (!head) throw new NotFoundError();

  const entityDef = await loadEntityDefinition(ctx, parsed.data.entityId);
  const issues = validateFormAgainstEntity(parsed.data, entityDef.fields);
  if (issues.length > 0) {
    throw new ValidationFailedError({ componentIssues: issues });
  }

  const v = await formRepo.appendFormVersion(q, {
    formId: id,
    definition: parsed.data,
    createdBy: ctx.userId!,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'form',
    artifactId: id,
    action: 'update',
    afterRef: `form_versions/${v.id}`,
    metadata: { version: v.version },
  });

  return { version: v.version };
}

export async function publishForm(
  ctx: TenantContext,
  id: string,
  version: number,
): Promise<void> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const q = withTenant(ctx.tenantId);
  const head = await formRepo.getForm(q, id);
  if (!head) throw new NotFoundError();
  const v = await formRepo.getFormVersion(q, id, version);
  if (!v) throw new NotFoundError(`Form version ${version} not found.`);

  await formRepo.publishForm(q, id, version);

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'form',
    artifactId: id,
    action: 'publish',
    afterRef: `form_versions/${v.id}`,
    metadata: { version },
  });
}
