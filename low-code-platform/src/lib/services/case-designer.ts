/**
 * Case Designer service. Implements Requirement 4.
 *
 * Validates that referenced forms exist + are published + bound to the same
 * primary entity (Req 4.3, 4.9). Persists versioned snapshots and exposes
 * publish + delete checks.
 */

import { withTenant } from '@/lib/db/repositories/base';
import * as caseTypeRepo from '@/lib/db/repositories/case-types';
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
  caseTypeDefinitionSchema,
  createCaseTypeInputSchema,
  type CaseTypeDefinition,
  type CreateCaseTypeInput,
} from '@/lib/validation/case-type';
import * as audit from '@/lib/services/audit';

export interface CaseTypeSummary {
  id: string;
  name: string;
  label: string;
  primaryEntityId: string;
  publishedVersion: number | null;
  updatedAt: Date;
}

interface ReferenceIssue {
  path: (string | number)[];
  reason: string;
}

/**
 * Cross-checks the case type against tenant forms + entities.
 * - Every form_step's formId must exist, be published, and bind to the same primary entity.
 */
async function checkReferences(
  ctx: TenantContext,
  def: CaseTypeDefinition,
): Promise<ReferenceIssue[]> {
  const q = withTenant(ctx.tenantId);
  const issues: ReferenceIssue[] = [];

  const entity = await entityRepo.getEntity(q, def.primaryEntityId);
  if (!entity) {
    issues.push({ path: ['primaryEntityId'], reason: 'Primary entity not found.' });
    return issues;
  }

  const connectorRepo = await import('@/lib/db/repositories/connectors');
  const decisionRepo = await import('@/lib/db/repositories/decision-tables');

  for (let sIdx = 0; sIdx < def.stages.length; sIdx++) {
    const stage = def.stages[sIdx]!;
    for (let stIdx = 0; stIdx < stage.steps.length; stIdx++) {
      const step = stage.steps[stIdx]!;
      if (step.kind === 'form_step') {
        const form = await formRepo.getForm(q, step.formId);
        if (!form) {
          issues.push({
            path: ['stages', sIdx, 'steps', stIdx, 'formId'],
            reason: `Form ${step.formId} not found.`,
          });
          continue;
        }
        if (form.publishedVersion == null) {
          issues.push({
            path: ['stages', sIdx, 'steps', stIdx, 'formId'],
            reason: `Form "${form.name}" must be published before being referenced in a case type.`,
          });
        }
        if (form.entityId !== def.primaryEntityId) {
          issues.push({
            path: ['stages', sIdx, 'steps', stIdx, 'formId'],
            reason: `Form "${form.name}" is bound to a different entity than this case type.`,
          });
        }
      } else if (step.kind === 'connector_step') {
        const conn = await connectorRepo.getById(q, step.connectorId);
        if (!conn) {
          issues.push({
            path: ['stages', sIdx, 'steps', stIdx, 'connectorId'],
            reason: `Connector ${step.connectorId} not found.`,
          });
        }
      } else if (step.kind === 'decision_step') {
        const table = await decisionRepo.getById(q, step.decisionTableId);
        if (!table) {
          issues.push({
            path: ['stages', sIdx, 'steps', stIdx, 'decisionTableId'],
            reason: `Decision table ${step.decisionTableId} not found.`,
          });
        }
      }
    }
  }

  return issues;
}

export async function listCaseTypes(ctx: TenantContext): Promise<CaseTypeSummary[]> {
  const q = withTenant(ctx.tenantId);
  const rows = await caseTypeRepo.listCaseTypes(q);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    label: r.label,
    primaryEntityId: r.primaryEntityId,
    publishedVersion: r.publishedVersion,
    updatedAt: r.updatedAt,
  }));
}

export async function getCaseType(
  ctx: TenantContext,
  id: string,
): Promise<{
  summary: CaseTypeSummary;
  latestDefinition: CaseTypeDefinition | null;
  publishedDefinition: CaseTypeDefinition | null;
}> {
  const q = withTenant(ctx.tenantId);
  const head = await caseTypeRepo.getCaseType(q, id);
  if (!head) throw new NotFoundError();
  const versions = await caseTypeRepo.listVersions(q, id);
  const latest = versions[versions.length - 1];
  const published = head.publishedVersion
    ? versions.find((v) => v.version === head.publishedVersion) ?? null
    : null;
  return {
    summary: {
      id: head.id,
      name: head.name,
      label: head.label,
      primaryEntityId: head.primaryEntityId,
      publishedVersion: head.publishedVersion,
      updatedAt: head.updatedAt,
    },
    latestDefinition: latest ? (latest.definition as CaseTypeDefinition) : null,
    publishedDefinition: published ? (published.definition as CaseTypeDefinition) : null,
  };
}

export async function createCaseType(
  ctx: TenantContext,
  raw: unknown,
): Promise<CaseTypeSummary> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = createCaseTypeInputSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());
  const input: CreateCaseTypeInput = parsed.data;

  // primaryEntityId in definition must match top-level if both supplied.
  const issues = await checkReferences(ctx, input.definition);
  if (issues.length > 0) throw new ValidationFailedError({ referenceIssues: issues });

  const q = withTenant(ctx.tenantId);
  const existing = await caseTypeRepo.getCaseTypeByName(q, input.name);
  if (existing) throw new ConflictError(`Case type name "${input.name}" is already taken.`);

  const { caseType, version } = await caseTypeRepo.createCaseType(q, {
    name: input.name,
    label: input.label,
    primaryEntityId: input.definition.primaryEntityId,
    definition: input.definition,
    createdBy: ctx.userId!,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'case_type',
    artifactId: caseType.id,
    action: 'create',
    afterRef: `case_type_versions/${version.id}`,
    metadata: { name: caseType.name, version: version.version },
  });

  return {
    id: caseType.id,
    name: caseType.name,
    label: caseType.label,
    primaryEntityId: caseType.primaryEntityId,
    publishedVersion: caseType.publishedVersion,
    updatedAt: caseType.updatedAt,
  };
}

export async function updateCaseType(
  ctx: TenantContext,
  id: string,
  rawDefinition: unknown,
): Promise<{ version: number }> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const parsed = caseTypeDefinitionSchema.safeParse(rawDefinition);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());

  const q = withTenant(ctx.tenantId);
  const head = await caseTypeRepo.getCaseType(q, id);
  if (!head) throw new NotFoundError();

  const issues = await checkReferences(ctx, parsed.data);
  if (issues.length > 0) throw new ValidationFailedError({ referenceIssues: issues });

  const v = await caseTypeRepo.appendCaseTypeVersion(q, {
    caseTypeId: id,
    definition: parsed.data,
    createdBy: ctx.userId!,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'case_type',
    artifactId: id,
    action: 'update',
    afterRef: `case_type_versions/${v.id}`,
    metadata: { version: v.version },
  });

  return { version: v.version };
}

export async function publishCaseType(
  ctx: TenantContext,
  id: string,
  version: number,
): Promise<void> {
  requireAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN]);
  const q = withTenant(ctx.tenantId);
  const head = await caseTypeRepo.getCaseType(q, id);
  if (!head) throw new NotFoundError();
  const v = await caseTypeRepo.getCaseTypeVersion(q, id, version);
  if (!v) throw new NotFoundError(`Case type version ${version} not found.`);

  // Re-run reference checks at publish time in case forms have changed.
  const issues = await checkReferences(ctx, v.definition as CaseTypeDefinition);
  if (issues.length > 0) throw new ValidationFailedError({ referenceIssues: issues });

  await caseTypeRepo.publishCaseType(q, id, version);

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'case_type',
    artifactId: id,
    action: 'publish',
    afterRef: `case_type_versions/${v.id}`,
    metadata: { version },
  });
}
