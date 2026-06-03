/**
 * Releases service. Pillar V2.H — package + promote design versions
 * between tenants designated as environments.
 *
 * MVP scope: package known artifact types (entity, form, case_type,
 * decision_table). Promotion writes new head + new design_version into the
 * target tenant, preserving Property 2 (existing cases stay pinned).
 */

import { z } from 'zod';
import { withTenant } from '@/lib/db/repositories/base';
import * as releaseRepo from '@/lib/db/repositories/releases';
import * as entityRepo from '@/lib/db/repositories/entities';
import * as formRepo from '@/lib/db/repositories/forms';
import * as caseTypeRepo from '@/lib/db/repositories/case-types';
import * as decisionRepo from '@/lib/db/repositories/decision-tables';
import { ROLES, requireRole } from '@/lib/rbac/roles';
import {
  ConflictError,
  NotFoundError,
  ValidationFailedError,
} from '@/lib/auth/errors';
import * as audit from '@/lib/services/audit';
import { identifierSchema } from '@/lib/validation/identifiers';
import type { TenantContext } from '@/lib/tenancy/types';

const buildInputSchema = z.object({
  name: identifierSchema,
  notes: z.string().max(2000).optional(),
  approvalPolicy: z.enum(['none', 'single', 'dual']).default('none'),
  artifacts: z
    .array(
      z.object({
        artifactType: z.enum(['entity', 'form', 'case_type', 'decision_table']),
        artifactId: z.string().uuid(),
      }),
    )
    .min(1, 'A release must include at least one artifact.'),
});

export async function build(ctx: TenantContext, raw: unknown) {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  const parsed = buildInputSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());
  const q = withTenant(ctx.tenantId);

  const artifacts: releaseRepo.ReleaseManifestArtifact[] = [];

  for (const a of parsed.data.artifacts) {
    if (a.artifactType === 'entity') {
      const head = await entityRepo.getEntity(q, a.artifactId);
      if (!head) throw new NotFoundError(`Entity ${a.artifactId} not found.`);
      if (head.publishedVersion == null) {
        throw new ConflictError(`Entity "${head.name}" must be published.`);
      }
      const v = await entityRepo.getEntityVersion(q, head.id, head.publishedVersion);
      artifacts.push({
        artifactType: 'entity',
        sourceId: head.id,
        name: head.name,
        label: head.label,
        version: head.publishedVersion,
        definition: v?.definition ?? null,
      });
    } else if (a.artifactType === 'form') {
      const head = await formRepo.getForm(q, a.artifactId);
      if (!head) throw new NotFoundError(`Form ${a.artifactId} not found.`);
      if (head.publishedVersion == null) throw new ConflictError(`Form "${head.name}" must be published.`);
      const v = await formRepo.getFormVersion(q, head.id, head.publishedVersion);
      artifacts.push({
        artifactType: 'form',
        sourceId: head.id,
        name: head.name,
        label: head.label,
        version: head.publishedVersion,
        definition: v?.definition ?? null,
      });
    } else if (a.artifactType === 'case_type') {
      const head = await caseTypeRepo.getCaseType(q, a.artifactId);
      if (!head) throw new NotFoundError(`Case type ${a.artifactId} not found.`);
      if (head.publishedVersion == null) {
        throw new ConflictError(`Case type "${head.name}" must be published.`);
      }
      const v = await caseTypeRepo.getCaseTypeVersion(q, head.id, head.publishedVersion);
      artifacts.push({
        artifactType: 'case_type',
        sourceId: head.id,
        name: head.name,
        label: head.label,
        version: head.publishedVersion,
        definition: v?.definition ?? null,
      });
    } else {
      const head = await decisionRepo.getById(q, a.artifactId);
      if (!head) throw new NotFoundError(`Decision table ${a.artifactId} not found.`);
      artifacts.push({
        artifactType: 'decision_table',
        sourceId: head.id,
        name: head.name,
        label: head.label,
        version: 1,
        definition: head.definition,
      });
    }
  }

  let row: releaseRepo.ReleaseRow;
  try {
    row = await releaseRepo.create(q, {
      name: parsed.data.name,
      manifest: { artifacts, notes: parsed.data.notes },
      approvalPolicy: parsed.data.approvalPolicy,
      createdBy: ctx.userId!,
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '23505') {
      throw new ConflictError(`Release name "${parsed.data.name}" is already taken.`);
    }
    throw err;
  }

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'release',
    artifactId: row.id,
    action: 'create',
    metadata: { name: row.name, artifactCount: artifacts.length },
  });

  return row;
}

const promoteInputSchema = z.object({
  targetTenantId: z.string().uuid(),
});

const requiredApprovals: Record<releaseRepo.ApprovalPolicy, number> = {
  none: 0,
  single: 1,
  dual: 2,
};

/**
 * Record an approve/reject decision on a release. When the number of distinct
 * approve decisions meets the policy, the release transitions to `approved`.
 * Any reject decision moves it back to `draft`.
 */
export async function decide(
  ctx: TenantContext,
  releaseId: string,
  decision: 'approve' | 'reject',
  comment?: string,
): Promise<{ status: releaseRepo.ReleaseStatus; approvals: number; required: number }> {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  const q = withTenant(ctx.tenantId);
  const release = await releaseRepo.getById(q, releaseId);
  if (!release) throw new NotFoundError();
  if (release.status === 'promoted') {
    throw new ConflictError('Release is already promoted.');
  }
  // The release author cannot approve their own release (segregation of duties).
  if (decision === 'approve' && release.createdBy === ctx.userId) {
    throw new ConflictError('The release author cannot approve their own release.');
  }

  await releaseRepo.recordApproval(q, {
    releaseId,
    approverUserId: ctx.userId!,
    decision,
    comment,
  });

  const approvals = await releaseRepo.listApprovals(q, releaseId);
  const approveCount = approvals.filter((a) => a.decision === 'approve').length;
  const hasReject = approvals.some((a) => a.decision === 'reject');
  const required = requiredApprovals[release.approvalPolicy];

  let status: releaseRepo.ReleaseStatus = 'draft';
  if (!hasReject && approveCount >= required) {
    status = 'approved';
  }
  await releaseRepo.setStatus(q, releaseId, status);

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'release',
    artifactId: releaseId,
    action: decision === 'approve' ? 'approve' : 'reject',
    metadata: { approveCount, required, status },
  });

  return { status, approvals: approveCount, required };
}

export async function listApprovals(ctx: TenantContext, releaseId: string) {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  return releaseRepo.listApprovals(withTenant(ctx.tenantId), releaseId);
}

/**
 * Promote a release into a target tenant.
 *
 * For each artifact in the manifest:
 *   - upsert a head row (matched by `name`)
 *   - append a new design_version
 *   - mark that version as the new published_version
 *
 * Existing cases in the target tenant remain pinned to their pre-promotion
 * versions (Property 2 holds — no rows in `cases` are touched).
 */
export async function promote(
  ctx: TenantContext,
  releaseId: string,
  raw: unknown,
): Promise<{ promotedCount: number }> {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  const parsed = promoteInputSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationFailedError(parsed.error.flatten());

  const sourceQ = withTenant(ctx.tenantId);
  const release = await releaseRepo.getById(sourceQ, releaseId);
  if (!release) throw new NotFoundError();

  // Approval gate: a release with a policy must be `approved` before promotion.
  if (release.approvalPolicy !== 'none' && release.status !== 'approved') {
    throw new ConflictError(
      `Release requires ${release.approvalPolicy} approval before promotion. Current status: ${release.status}.`,
    );
  }
  if (release.status === 'promoted') {
    // Idempotency guard: re-promoting an already-promoted release is allowed
    // (it re-applies the same versions), but we note it.
  }

  const targetCtx: TenantContext = { ...ctx, tenantId: parsed.data.targetTenantId };
  const targetQ = withTenant(parsed.data.targetTenantId);

  let promoted = 0;
  // Build a name → new id map per artifact type so case-type forms reference
  // the target tenant's form ids instead of the source ids.
  const nameMap: Record<string, Map<string, string>> = {
    entity: new Map(),
    form: new Map(),
  };

  // Promote in dependency order: entity → form → decision_table → case_type.
  const order: Array<releaseRepo.ReleaseManifestArtifact['artifactType']> = [
    'entity',
    'decision_table',
    'form',
    'case_type',
  ];

  for (const kind of order) {
    for (const a of release.manifest.artifacts.filter((x) => x.artifactType === kind)) {
      if (a.artifactType === 'entity') {
        let head = await entityRepo.getEntityByName(targetQ, a.name);
        if (!head) {
          const created = await entityRepo.createEntity(targetQ, {
            name: a.name,
            label: a.label,
            definition: a.definition,
            createdBy: targetCtx.userId!,
          });
          head = created.entity;
          await entityRepo.publishEntity(targetQ, head.id, 1);
        } else {
          const v = await entityRepo.appendEntityVersion(targetQ, {
            entityId: head.id,
            definition: a.definition,
            createdBy: targetCtx.userId!,
          });
          await entityRepo.publishEntity(targetQ, head.id, v.version);
        }
        nameMap.entity!.set(a.name, head.id);
      } else if (a.artifactType === 'form') {
        let head = await formRepo.getFormByName(targetQ, a.name);
        // Rewrite the form definition's entityId to point to the target tenant's entity.
        const def = a.definition as { entityId?: string };
        // Find which source entity this form points at, by name lookup in the manifest.
        const sourceEntity = release.manifest.artifacts.find(
          (x) => x.artifactType === 'entity' && x.sourceId === def.entityId,
        );
        const targetEntityId = sourceEntity ? nameMap.entity!.get(sourceEntity.name) : null;
        const rewritten = sourceEntity && targetEntityId
          ? { ...def, entityId: targetEntityId }
          : def;

        if (!head) {
          const created = await formRepo.createForm(targetQ, {
            name: a.name,
            label: a.label,
            entityId: rewritten.entityId ?? '00000000-0000-0000-0000-000000000000',
            definition: rewritten,
            createdBy: targetCtx.userId!,
          });
          head = created.form;
          await formRepo.publishForm(targetQ, head.id, 1);
        } else {
          const v = await formRepo.appendFormVersion(targetQ, {
            formId: head.id,
            definition: rewritten,
            createdBy: targetCtx.userId!,
          });
          await formRepo.publishForm(targetQ, head.id, v.version);
        }
        nameMap.form!.set(a.name, head.id);
      } else if (a.artifactType === 'case_type') {
        // Rewrite primaryEntityId + form_step.formId to the target ids.
        const def = JSON.parse(JSON.stringify(a.definition)) as {
          primaryEntityId: string;
          stages: Array<{ steps: Array<{ kind: string; formId?: string }> }>;
        };
        const sourceEntity = release.manifest.artifacts.find(
          (x) => x.artifactType === 'entity' && x.sourceId === def.primaryEntityId,
        );
        const targetEntityId = sourceEntity ? nameMap.entity!.get(sourceEntity.name) : null;
        if (targetEntityId) def.primaryEntityId = targetEntityId;
        for (const stage of def.stages) {
          for (const step of stage.steps) {
            if (step.kind === 'form_step' && step.formId) {
              const sourceForm = release.manifest.artifacts.find(
                (x) => x.artifactType === 'form' && x.sourceId === step.formId,
              );
              const targetFormId = sourceForm ? nameMap.form!.get(sourceForm.name) : null;
              if (targetFormId) step.formId = targetFormId;
            }
          }
        }

        let head = await caseTypeRepo.getCaseTypeByName(targetQ, a.name);
        if (!head) {
          const created = await caseTypeRepo.createCaseType(targetQ, {
            name: a.name,
            label: a.label,
            primaryEntityId: def.primaryEntityId,
            definition: def,
            createdBy: targetCtx.userId!,
          });
          head = created.caseType;
          await caseTypeRepo.publishCaseType(targetQ, head.id, 1);
        } else {
          const v = await caseTypeRepo.appendCaseTypeVersion(targetQ, {
            caseTypeId: head.id,
            definition: def,
            createdBy: targetCtx.userId!,
          });
          await caseTypeRepo.publishCaseType(targetQ, head.id, v.version);
        }
      } else {
        // decision_table
        await decisionRepo.create(targetQ, {
          name: a.name,
          label: a.label,
          definition: a.definition,
        }).catch(async (err: unknown) => {
          if ((err as { code?: string })?.code !== '23505') throw err;
          // Already exists — update the definition.
          const existing = await decisionRepo.list(targetQ);
          const match = existing.find((d) => d.name === a.name);
          if (match) {
            await decisionRepo.update(targetQ, match.id, { definition: a.definition });
          }
        });
      }
      promoted++;
    }
  }

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'release',
    artifactId: releaseId,
    action: 'publish',
    metadata: {
      promoted,
      sourceTenantId: ctx.tenantId,
      targetTenantId: parsed.data.targetTenantId,
    },
  });

  await releaseRepo.setStatus(sourceQ, releaseId, 'promoted');

  return { promotedCount: promoted };
}

export async function list(ctx: TenantContext) {
  return releaseRepo.list(withTenant(ctx.tenantId));
}
