/**
 * Case Runtime service. Implements Requirement 6.
 *
 * Single source of truth for case progression: create, submit form_step,
 * submit approval_step, advance automated_step, fire notification_step,
 * reassign, send-back, resolve.
 *
 * Property 2 (pinned design version): every transition resolves against the
 * Case's pinned (case_type_id, case_type_version).
 * Property 4 (forward-or-declared progression): transitions only land on
 * declared targets.
 * Property 5 (send-back targets earlier): re-checked at runtime.
 */

import { withTenant } from '@/lib/db/repositories/base';
import { getDb } from '@/lib/db/client';
import * as caseRepo from '@/lib/db/repositories/cases';
import * as caseTypeRepo from '@/lib/db/repositories/case-types';
import * as formRepo from '@/lib/db/repositories/forms';
import * as usersRepo from '@/lib/db/repositories/users';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationFailedError,
} from '@/lib/auth/errors';
import { ROLES, hasRole, requireAnyRole } from '@/lib/rbac/roles';
import type { TenantContext } from '@/lib/tenancy/types';
import type {
  CaseTypeDefinition,
  Step,
  AssignmentPolicy,
  TransitionTarget,
} from '@/lib/validation/case-type';
import type { FormDefinition } from '@/lib/validation/form';
import { evaluate } from '@/lib/expressions';
import * as audit from '@/lib/services/audit';
import * as notifications from '@/lib/services/notifications';
import {
  declaredOrderIndex,
  findStage,
  findStep,
  firstStepOfStage,
  nextStepInOrder,
} from '@/lib/case-runtime/walker';
import { nextIdentifier } from '@/lib/case-runtime/identifier';
import { computeStatus, type SlaStatus } from '@/lib/services/sla-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CaseTypeDef = CaseTypeDefinition;
type StepDef = Step;
type Assignment = AssignmentPolicy;

interface PinnedDefinition {
  definition: CaseTypeDef;
  caseTypeName: string;
  primaryEntityId: string;
}

async function loadPinnedDefinition(
  ctx: TenantContext,
  caseTypeId: string,
  version: number,
): Promise<PinnedDefinition> {
  const q = withTenant(ctx.tenantId);
  const head = await caseTypeRepo.getCaseType(q, caseTypeId);
  if (!head) throw new NotFoundError('Case type not found.');
  const v = await caseTypeRepo.getCaseTypeVersion(q, caseTypeId, version);
  if (!v) throw new ConflictError('Pinned case type version is missing.');
  return {
    definition: v.definition as CaseTypeDef,
    caseTypeName: head.name,
    primaryEntityId: head.primaryEntityId,
  };
}

interface ResolvedAssignment {
  userId: string | null;
  role: string | null;
}

async function resolveAssignment(
  ctx: TenantContext,
  policy: Assignment,
  current: ResolvedAssignment,
  creatorUserId: string,
): Promise<ResolvedAssignment> {
  switch (policy.kind) {
    case 'specific_user':
      return { userId: policy.userId, role: null };
    case 'specific_role':
      return { userId: null, role: policy.role };
    case 'current_assignee':
      return current;
    case 'manager_of_creator': {
      // MVP heuristic: pick any tenant member with the manager role.
      const managers = await usersRepo.listMembersWithRole(ctx.tenantId, ROLES.MANAGER);
      const pick = managers.find((m) => m.userId !== creatorUserId) ?? managers[0];
      return pick ? { userId: pick.userId, role: ROLES.MANAGER } : { userId: null, role: ROLES.MANAGER };
    }
    default: {
      const _exhaustive: never = policy;
      void _exhaustive;
      return current;
    }
  }
}

function canSubmitOnBehalf(ctx: TenantContext, current: ResolvedAssignment): boolean {
  if (hasRole(ctx, ROLES.MANAGER) || hasRole(ctx, ROLES.PLATFORM_ADMIN)) return true;
  if (current.userId && current.userId === ctx.userId) return true;
  if (current.role && hasRole(ctx, current.role as never)) return true;
  return false;
}

function applyTarget(
  def: CaseTypeDef,
  target: TransitionTarget,
):
  | { kind: 'step'; stageId: string; step: StepDef }
  | { kind: 'resolve' }
  | null {
  if (target.kind === 'resolve') return { kind: 'resolve' };
  if (target.kind === 'step') {
    const loc = findStep(def, target.stepId);
    return loc ? { kind: 'step', stageId: loc.stage.id, step: loc.step } : null;
  }
  // stage: jump to the first step of the named stage.
  const stage = findStage(def, target.stageId);
  if (!stage) return null;
  const first = firstStepOfStage(stage.stage);
  return first ? { kind: 'step', stageId: stage.stage.id, step: first } : null;
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

export interface CreateCaseInput {
  caseTypeId: string;
  initialData?: Record<string, unknown>;
}

export async function createCase(
  ctx: TenantContext,
  input: CreateCaseInput,
): Promise<caseRepo.CaseRow> {
  requireAnyRole(ctx, [ROLES.CASE_WORKER, ROLES.MANAGER, ROLES.PLATFORM_ADMIN]);
  const q = withTenant(ctx.tenantId);
  const head = await caseTypeRepo.getCaseType(q, input.caseTypeId);
  if (!head) throw new NotFoundError('Case type not found.');
  if (head.publishedVersion == null) {
    throw new ValidationFailedError({
      formErrors: ['Case type has no published version yet.'],
    });
  }
  const pinned = await loadPinnedDefinition(ctx, input.caseTypeId, head.publishedVersion);
  const firstStage = pinned.definition.stages[0]!;
  const firstStep = firstStage.steps[0]!;
  const isAutoKind =
    firstStep.kind === 'notification_step' ||
    firstStep.kind === 'automated_step' ||
    firstStep.kind === 'connector_step' ||
    firstStep.kind === 'decision_step';
  const assignment = await resolveAssignment(
    ctx,
    isAutoKind
      ? { kind: 'specific_user', userId: ctx.userId! }
      : firstStep.assignment,
    { userId: null, role: null },
    ctx.userId!,
  );

  const identifier = await nextIdentifier(getDb(), ctx.tenantId, head.id, head.name);

  const created = await caseRepo.createCase(q, {
    caseTypeId: head.id,
    caseTypeVersion: head.publishedVersion,
    identifier,
    currentStageId: firstStage.id,
    currentStepId: firstStep.id,
    currentAssigneeUserId: assignment.userId,
    currentAssigneeRole: assignment.role,
    primaryEntityData: input.initialData ?? {},
    createdBy: ctx.userId!,
  });

  await caseRepo.recordHistory(q, {
    caseId: created.id,
    fromStageId: null,
    toStageId: firstStage.id,
    fromStepId: null,
    toStepId: firstStep.id,
    action: 'create',
    actorUserId: ctx.userId!,
  });
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'case',
    artifactId: created.id,
    action: 'create',
    metadata: { identifier, caseType: head.name },
  });
  await fireAssignmentNotification(ctx, created, firstStep);

  // Auto-advance through automated/notification steps that don't need user input.
  return autoAdvanceIfPossible(ctx, created, pinned);
}

async function fireAssignmentNotification(
  ctx: TenantContext,
  c: caseRepo.CaseRow,
  step: StepDef,
): Promise<void> {
  if (
    step.kind === 'automated_step' ||
    step.kind === 'notification_step' ||
    step.kind === 'connector_step' ||
    step.kind === 'decision_step'
  ) {
    return;
  }
  await notifications.notify(ctx, {
    recipientUserIds: c.currentAssigneeUserId ? [c.currentAssigneeUserId] : [],
    recipientRoles: c.currentAssigneeRole ? [c.currentAssigneeRole] : [],
    kind: 'assignment',
    caseId: c.id,
    payload: { stepId: step.id, stepName: step.name, identifier: c.identifier },
  });
}

async function autoAdvanceIfPossible(
  ctx: TenantContext,
  c: caseRepo.CaseRow,
  pinned: PinnedDefinition,
): Promise<caseRepo.CaseRow> {
  let current = c;
  let safety = 0;
  while (safety++ < 50) {
    const loc = findStep(pinned.definition, current.currentStepId);
    if (!loc) return current;
    if (loc.step.kind === 'automated_step' || loc.step.kind === 'notification_step') {
      if (loc.step.kind === 'notification_step') {
        await notifications.notify(ctx, {
          recipientUserIds: c.currentAssigneeUserId ? [c.currentAssigneeUserId] : [],
          recipientRoles: c.currentAssigneeRole ? [c.currentAssigneeRole] : [],
          kind: 'assignment',
          caseId: current.id,
          payload: { template: loc.step.template },
        });
      }
      current = await advanceFrom(ctx, current, pinned, undefined);
      continue;
    }
    if (loc.step.kind === 'connector_step') {
      current = await runConnectorStep(ctx, current, loc.step, pinned);
      continue;
    }
    if (loc.step.kind === 'decision_step') {
      current = await runDecisionStep(ctx, current, loc.step, pinned);
      continue;
    }
    return current;
  }
  return current;
}

/**
 * Read a value from `primaryEntityData` by dot-path, falling back to the
 * literal expression value if the path doesn't resolve. Inputs maps in the
 * step definition look like `{ targetKey: 'fieldPath' | literal }`.
 */
function readPath(values: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = values;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function writePath(values: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = values;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (typeof cursor[part] !== 'object' || cursor[part] === null) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
}

async function runConnectorStep(
  ctx: TenantContext,
  c: caseRepo.CaseRow,
  step: Extract<StepDef, { kind: 'connector_step' }>,
  pinned: PinnedDefinition,
): Promise<caseRepo.CaseRow> {
  const q = withTenant(ctx.tenantId);

  // Resolve inputs: each value in step.inputs is either a literal (numbers,
  // booleans, plain strings) or a string starting with "$" interpreted as a
  // path into primaryEntityData.
  const resolvedInputs: Record<string, unknown> = {};
  for (const [k, raw] of Object.entries(step.inputs)) {
    if (typeof raw === 'string' && raw.startsWith('$')) {
      resolvedInputs[k] = readPath(c.primaryEntityData, raw.slice(1));
    } else {
      resolvedInputs[k] = raw;
    }
  }

  const connectorService = await import('@/lib/services/connectors');
  let response: Awaited<ReturnType<typeof connectorService.invokeById>> | null = null;
  let invocationError: string | null = null;
  try {
    response = await connectorService.invokeById(ctx, step.connectorId, {
      inputs: resolvedInputs,
    });
  } catch (err) {
    invocationError = err instanceof Error ? err.message : String(err);
  }

  // Persist response (or error) onto primaryEntityData when configured.
  let updatedData = c.primaryEntityData;
  if (response && step.responseMapping) {
    const value = readPath(
      typeof response.body === 'object' && response.body !== null
        ? (response.body as Record<string, unknown>)
        : { body: response.body },
      step.responseMapping.path,
    );
    updatedData = { ...updatedData };
    writePath(updatedData, step.responseMapping.assignTo, value);
    await caseRepo.updateCaseState(q, c.id, { primaryEntityData: updatedData });
  }

  await caseRepo.recordHistory(q, {
    caseId: c.id,
    fromStageId: c.currentStageId,
    toStageId: c.currentStageId,
    fromStepId: c.currentStepId,
    toStepId: c.currentStepId,
    action: 'advance',
    actorUserId: ctx.userId!,
    payload: {
      kind: 'connector_step',
      connectorId: step.connectorId,
      inputs: resolvedInputs,
      response: response
        ? { status: response.status, ok: response.ok, elapsedMs: response.elapsedMs }
        : null,
      error: invocationError,
    },
  });

  if (invocationError && step.onError === 'halt') {
    // Leave the case where it is so a manager can intervene.
    return { ...c, primaryEntityData: updatedData };
  }
  // Continue past failure (or success) to the next step / declared transition.
  return advanceFrom(ctx, { ...c, primaryEntityData: updatedData }, pinned, undefined, updatedData);
}

async function runDecisionStep(
  ctx: TenantContext,
  c: caseRepo.CaseRow,
  step: Extract<StepDef, { kind: 'decision_step' }>,
  pinned: PinnedDefinition,
): Promise<caseRepo.CaseRow> {
  const q = withTenant(ctx.tenantId);

  // Map case data into decision table inputs.
  const inputs: Record<string, unknown> = {};
  for (const [columnId, fieldPath] of Object.entries(step.inputs)) {
    inputs[columnId] = readPath(c.primaryEntityData, fieldPath);
  }

  const decisionService = await import('@/lib/services/decision-tables');
  const result = await decisionService.evaluateById(ctx, step.decisionTableId, inputs);

  // Apply outputs back to primaryEntityData.
  let updatedData = c.primaryEntityData;
  if (step.outputAssignments) {
    updatedData = { ...updatedData };
    for (const [columnId, fieldName] of Object.entries(step.outputAssignments)) {
      writePath(updatedData, fieldName, result.outputs[columnId]);
    }
    await caseRepo.updateCaseState(q, c.id, { primaryEntityData: updatedData });
  }

  await caseRepo.recordHistory(q, {
    caseId: c.id,
    fromStageId: c.currentStageId,
    toStageId: c.currentStageId,
    fromStepId: c.currentStepId,
    toStepId: c.currentStepId,
    action: 'advance',
    actorUserId: ctx.userId!,
    payload: {
      kind: 'decision_step',
      decisionTableId: step.decisionTableId,
      inputs,
      result,
    },
  });

  return advanceFrom(ctx, { ...c, primaryEntityData: updatedData }, pinned, undefined, updatedData);
}

/**
 * Move the case to the next target according to the step's declared
 * transitions. If `decision` is provided (approve/reject), it picks the
 * approval step's branch.
 */
async function advanceFrom(
  ctx: TenantContext,
  c: caseRepo.CaseRow,
  pinned: PinnedDefinition,
  decision: 'approve' | 'reject' | undefined,
  conditionValues?: Record<string, unknown>,
): Promise<caseRepo.CaseRow> {
  const q = withTenant(ctx.tenantId);
  const loc = findStep(pinned.definition, c.currentStepId);
  if (!loc) throw new ConflictError('Case step is not present in pinned definition.');

  const def = pinned.definition;

  // Determine target.
  let target:
    | { kind: 'step'; stageId: string; step: StepDef }
    | { kind: 'resolve' }
    | null = null;

  if (loc.step.kind === 'approval_step' && decision) {
    target = applyTarget(def, decision === 'approve' ? loc.step.approveTarget : loc.step.rejectTarget);
  } else if (loc.step.kind !== 'approval_step') {
    // Conditional transitions (only on form/notification/automated).
    const transitions = (loc.step.transitions ?? []) as Array<{
      condition: import('@/lib/types/expressions').ExpressionAst;
      target: TransitionTarget;
    }>;
    for (const t of transitions) {
      if (evaluate(t.condition, conditionValues ?? c.primaryEntityData)) {
        target = applyTarget(def, t.target);
        break;
      }
    }
  }
  if (!target) {
    // Default: next step in declared order.
    const next = nextStepInOrder(def, c.currentStepId);
    if (!next) throw new ConflictError('Case step is not present in pinned definition.');
    if (next.kind === 'resolve') target = { kind: 'resolve' };
    else if (next.kind === 'step') target = { kind: 'step', stageId: next.stageId, step: next.step };
    else target = { kind: 'step', stageId: next.stage.id, step: next.step };
  }

  if (target.kind === 'resolve') {
    const updated = await caseRepo.updateCaseState(q, c.id, { status: 'resolved' });
    await caseRepo.recordHistory(q, {
      caseId: c.id,
      fromStageId: c.currentStageId,
      toStageId: null,
      fromStepId: c.currentStepId,
      toStepId: null,
      action: 'resolve',
      actorUserId: ctx.userId!,
    });
    await audit.record(ctx, {
      actorUserId: ctx.userId,
      artifactType: 'case',
      artifactId: c.id,
      action: 'resolve',
    });
    return updated;
  }

  // Re-resolve assignment. For the first step of a new stage, the assignment
  // policy of that step applies; otherwise we apply the new step's policy.
  const stageEnteredAt = target.stageId !== c.currentStageId ? new Date() : c.stageEnteredAt;
  const newStep = target.step;
  const newAssignment =
    newStep.kind === 'automated_step' ||
    newStep.kind === 'notification_step' ||
    newStep.kind === 'connector_step' ||
    newStep.kind === 'decision_step'
      ? { userId: c.currentAssigneeUserId, role: c.currentAssigneeRole }
      : await resolveAssignment(
          ctx,
          newStep.assignment,
          { userId: c.currentAssigneeUserId, role: c.currentAssigneeRole },
          c.createdBy,
        );

  const updated = await caseRepo.updateCaseState(q, c.id, {
    currentStageId: target.stageId,
    currentStepId: newStep.id,
    currentAssigneeUserId: newAssignment.userId,
    currentAssigneeRole: newAssignment.role,
    stageEnteredAt,
  });

  await caseRepo.recordHistory(q, {
    caseId: c.id,
    fromStageId: c.currentStageId,
    toStageId: target.stageId,
    fromStepId: c.currentStepId,
    toStepId: newStep.id,
    action: decision === 'approve' ? 'approve' : decision === 'reject' ? 'reject' : 'advance',
    actorUserId: ctx.userId!,
    payload: conditionValues ? { conditionValues } : undefined,
  });

  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'case',
    artifactId: c.id,
    action: 'advance',
    metadata: { fromStep: c.currentStepId, toStep: newStep.id },
  });

  await fireAssignmentNotification(ctx, updated, newStep);

  return updated;
}

export interface SubmitFormStepInput {
  caseId: string;
  fieldValues: Record<string, unknown>;
}

export async function submitFormStep(
  ctx: TenantContext,
  input: SubmitFormStepInput,
): Promise<caseRepo.CaseRow> {
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, input.caseId);
  if (!c) throw new NotFoundError();
  if (c.status !== 'active') throw new ConflictError('Case is not active.');
  const pinned = await loadPinnedDefinition(ctx, c.caseTypeId, c.caseTypeVersion);
  const loc = findStep(pinned.definition, c.currentStepId);
  if (!loc || loc.step.kind !== 'form_step') {
    throw new ConflictError('Current step is not a form_step.');
  }
  if (!canSubmitOnBehalf(ctx, { userId: c.currentAssigneeUserId, role: c.currentAssigneeRole })) {
    throw new ForbiddenError();
  }

  // Form-level Zod check happens via the Form Renderer's runtime helpers; for
  // the API surface here we accept any object and persist as-is. Per-field
  // validation is enforced at form publish time.
  const merged = { ...c.primaryEntityData, ...input.fieldValues };
  await caseRepo.updateCaseState(q, c.id, { primaryEntityData: merged });

  const advanced = await advanceFrom(ctx, { ...c, primaryEntityData: merged }, pinned, undefined, merged);
  return autoAdvanceIfPossible(ctx, advanced, pinned);
}

export async function submitApproval(
  ctx: TenantContext,
  caseId: string,
  decision: 'approve' | 'reject',
): Promise<caseRepo.CaseRow> {
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, caseId);
  if (!c) throw new NotFoundError();
  if (c.status !== 'active') throw new ConflictError('Case is not active.');
  const pinned = await loadPinnedDefinition(ctx, c.caseTypeId, c.caseTypeVersion);
  const loc = findStep(pinned.definition, c.currentStepId);
  if (!loc || loc.step.kind !== 'approval_step') {
    throw new ConflictError('Current step is not an approval_step.');
  }
  if (!canSubmitOnBehalf(ctx, { userId: c.currentAssigneeUserId, role: c.currentAssigneeRole })) {
    throw new ForbiddenError();
  }
  const advanced = await advanceFrom(ctx, c, pinned, decision);
  return autoAdvanceIfPossible(ctx, advanced, pinned);
}

export async function reassign(
  ctx: TenantContext,
  caseId: string,
  newAssigneeUserId: string,
): Promise<caseRepo.CaseRow> {
  requireAnyRole(ctx, [ROLES.MANAGER, ROLES.PLATFORM_ADMIN]);
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, caseId);
  if (!c) throw new NotFoundError();
  // Validate the assignee is a member of this tenant.
  const member = await usersRepo.getMembership(ctx.tenantId, newAssigneeUserId);
  if (!member) throw new ValidationFailedError({ formErrors: ['User is not a member of this tenant.'] });

  const updated = await caseRepo.updateCaseState(q, caseId, {
    currentAssigneeUserId: newAssigneeUserId,
    currentAssigneeRole: null,
  });
  await caseRepo.recordHistory(q, {
    caseId,
    fromStageId: c.currentStageId,
    toStageId: c.currentStageId,
    fromStepId: c.currentStepId,
    toStepId: c.currentStepId,
    action: 'reassign',
    actorUserId: ctx.userId!,
    payload: {
      previousAssigneeUserId: c.currentAssigneeUserId,
      newAssigneeUserId,
    },
  });
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'case',
    artifactId: caseId,
    action: 'reassign',
    metadata: { previousAssigneeUserId: c.currentAssigneeUserId, newAssigneeUserId },
  });
  await notifications.notify(ctx, {
    recipientUserIds: [newAssigneeUserId, c.currentAssigneeUserId].filter(Boolean) as string[],
    kind: 'reassignment',
    caseId,
    payload: { identifier: c.identifier },
  });
  return updated;
}

export async function sendBack(
  ctx: TenantContext,
  caseId: string,
  transitionId: string,
  reason?: string,
): Promise<caseRepo.CaseRow> {
  requireAnyRole(ctx, [ROLES.MANAGER, ROLES.PLATFORM_ADMIN]);
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, caseId);
  if (!c) throw new NotFoundError();
  if (c.status !== 'active') throw new ConflictError('Case is not active.');
  const pinned = await loadPinnedDefinition(ctx, c.caseTypeId, c.caseTypeVersion);
  const loc = findStep(pinned.definition, c.currentStepId);
  if (!loc) throw new ConflictError();

  const sendBacks =
    loc.step.kind === 'form_step' || loc.step.kind === 'approval_step'
      ? loc.step.sendBack ?? []
      : [];
  const sb = sendBacks.find((s) => s.id === transitionId);
  if (!sb) {
    throw new ValidationFailedError({ formErrors: ['No matching send-back transition.'] });
  }

  // Property 5: re-check that target precedes current step in declared order.
  const targetIdx = declaredOrderIndex(pinned.definition, sb.targetStepId);
  const myIdx = declaredOrderIndex(pinned.definition, c.currentStepId);
  if (targetIdx < 0 || targetIdx >= myIdx) {
    throw new ConflictError('Send-back target must precede the current step.');
  }

  const targetLoc = findStep(pinned.definition, sb.targetStepId)!;
  const newAssignment =
    targetLoc.step.kind === 'automated_step' ||
    targetLoc.step.kind === 'notification_step' ||
    targetLoc.step.kind === 'connector_step' ||
    targetLoc.step.kind === 'decision_step'
      ? { userId: c.currentAssigneeUserId, role: c.currentAssigneeRole }
      : await resolveAssignment(
          ctx,
          targetLoc.step.assignment,
          { userId: c.currentAssigneeUserId, role: c.currentAssigneeRole },
          c.createdBy,
        );

  const updated = await caseRepo.updateCaseState(q, caseId, {
    currentStageId: targetLoc.stage.id,
    currentStepId: targetLoc.step.id,
    currentAssigneeUserId: newAssignment.userId,
    currentAssigneeRole: newAssignment.role,
    stageEnteredAt: targetLoc.stage.id !== c.currentStageId ? new Date() : c.stageEnteredAt,
  });
  await caseRepo.recordHistory(q, {
    caseId,
    fromStageId: c.currentStageId,
    toStageId: targetLoc.stage.id,
    fromStepId: c.currentStepId,
    toStepId: targetLoc.step.id,
    action: 'send_back',
    actorUserId: ctx.userId!,
    payload: { reason: reason ?? null },
  });
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'case',
    artifactId: caseId,
    action: 'send_back',
    metadata: { reason: reason ?? null, toStep: targetLoc.step.id },
  });
  if (newAssignment.userId) {
    await notifications.notify(ctx, {
      recipientUserIds: [newAssignment.userId],
      kind: 'send_back',
      caseId,
      payload: { reason: reason ?? null, identifier: c.identifier },
    });
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Read APIs
// ---------------------------------------------------------------------------

export interface CaseDetail {
  case: caseRepo.CaseRow;
  caseTypeName: string;
  primaryEntityId: string;
  definition: CaseTypeDef;
  formForCurrentStep: FormDefinition | null;
  slaStatus: SlaStatus | null;
  history: Awaited<ReturnType<typeof caseRepo.listHistory>>;
}

export async function getCaseDetail(ctx: TenantContext, id: string): Promise<CaseDetail> {
  const q = withTenant(ctx.tenantId);
  const c = await caseRepo.getCase(q, id);
  if (!c) throw new NotFoundError();
  const pinned = await loadPinnedDefinition(ctx, c.caseTypeId, c.caseTypeVersion);
  const loc = findStep(pinned.definition, c.currentStepId);
  let formForCurrentStep: FormDefinition | null = null;
  if (loc && loc.step.kind === 'form_step') {
    const form = await formRepo.getForm(q, loc.step.formId);
    if (form?.publishedVersion != null) {
      const v = await formRepo.getFormVersion(q, form.id, form.publishedVersion);
      if (v) formForCurrentStep = v.definition as FormDefinition;
    }
  }
  const stage = pinned.definition.stages.find((s) => s.id === c.currentStageId);
  const sla = stage?.sla ?? pinned.definition.sla ?? null;
  const slaStatus = sla
    ? computeStatus({ stageEnteredAt: c.stageEnteredAt, sla })
    : null;
  const history = await caseRepo.listHistory(q, id);
  return {
    case: c,
    caseTypeName: pinned.caseTypeName,
    primaryEntityId: pinned.primaryEntityId,
    definition: pinned.definition,
    formForCurrentStep,
    slaStatus,
    history,
  };
}
