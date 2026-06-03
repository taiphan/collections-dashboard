/**
 * Editor-local draft types. These mirror the validated CaseTypeDefinition but
 * use loose optionals so a half-built definition can live in component state.
 * The editor serializes to the strict shape on save; the server re-validates.
 */

export interface DesignerContext {
  entities: Array<{ id: string; name: string; label: string }>;
  forms: Array<{ id: string; name: string; label: string; entityId: string }>;
  connectors: Array<{ id: string; name: string; label: string; kind: string }>;
  decisionTables: Array<{ id: string; name: string; label: string }>;
}

export type StepKind =
  | 'form_step'
  | 'approval_step'
  | 'notification_step'
  | 'automated_step'
  | 'connector_step'
  | 'decision_step';

export interface DraftStep {
  id: string;
  name: string;
  kind: StepKind;
  // form_step
  formId?: string;
  // shared assignment for user-facing steps
  assignmentKind?: 'specific_user' | 'specific_role' | 'manager_of_creator' | 'current_assignee';
  assignmentRole?: string;
  assignmentUserId?: string;
  // approval_step targets
  approveTargetStepId?: string;
  rejectTargetStepId?: string;
  // notification_step
  notificationTemplate?: string;
  notificationRole?: string;
  // connector_step
  connectorId?: string;
  connectorInputs?: string; // JSON text
  // decision_step
  decisionTableId?: string;
  decisionInputs?: string; // JSON text
  // send-back (form/approval)
  sendBackTargetStepId?: string;
  sendBackLabel?: string;
}

export interface DraftStage {
  id: string;
  name: string;
  slaTargetMinutes?: number;
  slaWarningMinutes?: number;
  steps: DraftStep[];
}

export interface DraftCaseType {
  primaryEntityId: string;
  slaTargetMinutes?: number;
  slaWarningMinutes?: number;
  stages: DraftStage[];
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}
