/**
 * Convert the editor draft into the strict CaseTypeDefinition shape the API
 * expects. Drops empty/optional fields so Zod's discriminated union accepts
 * the result. The server re-validates, so this is best-effort shaping, not a
 * source of truth for validity.
 */

import type { CaseTypeDefinition } from '@/lib/validation/case-type';
import type { DraftCaseType, DraftStep } from './types';

function assignment(step: DraftStep) {
  switch (step.assignmentKind) {
    case 'specific_user':
      return { kind: 'specific_user' as const, userId: step.assignmentUserId ?? '' };
    case 'manager_of_creator':
      return { kind: 'manager_of_creator' as const };
    case 'current_assignee':
      return { kind: 'current_assignee' as const };
    case 'specific_role':
    default:
      return { kind: 'specific_role' as const, role: step.assignmentRole ?? 'case_worker' };
  }
}

function sendBack(step: DraftStep) {
  if (!step.sendBackTargetStepId) return undefined;
  return [
    {
      id: `${step.id}_sb`,
      targetStepId: step.sendBackTargetStepId,
      label: step.sendBackLabel || 'Send back',
    },
  ];
}

function parseJsonRecord(text: string | undefined): Record<string, unknown> {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function serializeStep(step: DraftStep): unknown {
  switch (step.kind) {
    case 'form_step':
      return {
        id: step.id,
        name: step.name,
        kind: 'form_step',
        formId: step.formId,
        assignment: assignment(step),
        ...(sendBack(step) ? { sendBack: sendBack(step) } : {}),
      };
    case 'approval_step':
      return {
        id: step.id,
        name: step.name,
        kind: 'approval_step',
        assignment: assignment(step),
        approveTarget: step.approveTargetStepId
          ? { kind: 'step', stepId: step.approveTargetStepId }
          : { kind: 'resolve' },
        rejectTarget: step.rejectTargetStepId
          ? { kind: 'step', stepId: step.rejectTargetStepId }
          : { kind: 'resolve' },
        ...(sendBack(step) ? { sendBack: sendBack(step) } : {}),
      };
    case 'notification_step':
      return {
        id: step.id,
        name: step.name,
        kind: 'notification_step',
        recipients: [
          step.notificationRole
            ? { kind: 'specific_role', role: step.notificationRole }
            : { kind: 'current_assignee' },
        ],
        template: step.notificationTemplate || 'Notification',
      };
    case 'automated_step':
      return { id: step.id, name: step.name, kind: 'automated_step' };
    case 'connector_step':
      return {
        id: step.id,
        name: step.name,
        kind: 'connector_step',
        connectorId: step.connectorId,
        inputs: parseJsonRecord(step.connectorInputs),
        onError: 'halt',
      };
    case 'decision_step':
      return {
        id: step.id,
        name: step.name,
        kind: 'decision_step',
        decisionTableId: step.decisionTableId,
        inputs: parseJsonRecord(step.decisionInputs) as Record<string, string>,
      };
  }
}

export function serializeDraft(draft: DraftCaseType): CaseTypeDefinition {
  const def = {
    primaryEntityId: draft.primaryEntityId,
    ...(draft.slaTargetMinutes
      ? {
          sla: {
            targetMinutes: draft.slaTargetMinutes,
            ...(draft.slaWarningMinutes ? { warningMinutes: draft.slaWarningMinutes } : {}),
          },
        }
      : {}),
    stages: draft.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      ...(stage.slaTargetMinutes
        ? {
            sla: {
              targetMinutes: stage.slaTargetMinutes,
              ...(stage.slaWarningMinutes ? { warningMinutes: stage.slaWarningMinutes } : {}),
            },
          }
        : {}),
      steps: stage.steps.map(serializeStep),
    })),
  };
  return def as unknown as CaseTypeDefinition;
}
