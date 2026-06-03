/**
 * Convert a stored CaseTypeDefinition back into an editor draft so the
 * CaseTypeEditor can load an existing case type for a new version.
 */

import type { CaseTypeDefinition } from '@/lib/validation/case-type';
import type { DraftCaseType, DraftStep } from './types';

export function toDraft(def: CaseTypeDefinition): DraftCaseType {
  return {
    primaryEntityId: def.primaryEntityId,
    slaTargetMinutes: def.sla?.targetMinutes,
    slaWarningMinutes: def.sla?.warningMinutes,
    stages: def.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      slaTargetMinutes: stage.sla?.targetMinutes,
      slaWarningMinutes: stage.sla?.warningMinutes,
      steps: stage.steps.map(toDraftStep),
    })),
  };
}

function toDraftStep(step: CaseTypeDefinition['stages'][number]['steps'][number]): DraftStep {
  const base: DraftStep = { id: step.id, name: step.name, kind: step.kind };

  if (step.kind === 'form_step') {
    base.formId = step.formId;
    applyAssignment(base, step.assignment);
    applySendBack(base, step.sendBack);
  } else if (step.kind === 'approval_step') {
    applyAssignment(base, step.assignment);
    if (step.approveTarget.kind === 'step') base.approveTargetStepId = step.approveTarget.stepId;
    if (step.rejectTarget.kind === 'step') base.rejectTargetStepId = step.rejectTarget.stepId;
    applySendBack(base, step.sendBack);
  } else if (step.kind === 'notification_step') {
    base.notificationTemplate = step.template;
    const r = step.recipients[0];
    if (r && r.kind === 'specific_role') base.notificationRole = r.role;
  } else if (step.kind === 'connector_step') {
    base.connectorId = step.connectorId;
    base.connectorInputs = JSON.stringify(step.inputs, null, 2);
  } else if (step.kind === 'decision_step') {
    base.decisionTableId = step.decisionTableId;
    base.decisionInputs = JSON.stringify(step.inputs, null, 2);
  }
  return base;
}

function applyAssignment(
  base: DraftStep,
  assignment: { kind: string; role?: string; userId?: string },
): void {
  base.assignmentKind = assignment.kind as DraftStep['assignmentKind'];
  if (assignment.kind === 'specific_role') base.assignmentRole = assignment.role;
  if (assignment.kind === 'specific_user') base.assignmentUserId = assignment.userId;
}

function applySendBack(
  base: DraftStep,
  sendBack: Array<{ targetStepId: string; label: string }> | undefined,
): void {
  const first = sendBack?.[0];
  if (first) {
    base.sendBackTargetStepId = first.targetStepId;
    base.sendBackLabel = first.label;
  }
}
