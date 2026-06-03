'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BpmnCanvas } from './BpmnCanvas';
import { serializeDraft } from './serialize';
import {
  newId,
  type DesignerContext,
  type DraftCaseType,
  type DraftStage,
  type DraftStep,
  type StepKind,
} from './types';
import type { CaseTypeDefinition } from '@/lib/validation/case-type';

interface Props {
  context: DesignerContext;
  /** When editing an existing case type. */
  existing?: { id: string; name: string; label: string; draft: DraftCaseType };
}

const STEP_KIND_LABELS: Record<StepKind, string> = {
  form_step: 'Form',
  approval_step: 'Approval',
  notification_step: 'Notification',
  automated_step: 'Automated',
  connector_step: 'Connector',
  decision_step: 'Decision',
};

const ROLES = ['case_worker', 'manager', 'app_designer', 'platform_admin'];

export function CaseTypeEditor({ context, existing }: Props) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [draft, setDraft] = useState<DraftCaseType>(
    existing?.draft ?? {
      primaryEntityId: context.entities[0]?.id ?? '',
      stages: [
        {
          id: newId('stage'),
          name: 'Intake',
          steps: [
            {
              id: newId('step'),
              name: 'Collect information',
              kind: 'form_step',
              assignmentKind: 'specific_role',
              assignmentRole: 'case_worker',
            },
          ],
        },
      ],
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const allSteps = useMemo(
    () => draft.stages.flatMap((s) => s.steps),
    [draft],
  );

  // Forms compatible with the chosen primary entity.
  const compatibleForms = useMemo(
    () => context.forms.filter((f) => f.entityId === draft.primaryEntityId),
    [context.forms, draft.primaryEntityId],
  );

  let preview: CaseTypeDefinition | null = null;
  let previewError: string | null = null;
  try {
    preview = serializeDraft(draft);
  } catch {
    previewError = 'Definition is incomplete.';
  }

  function update(mut: (d: DraftCaseType) => void) {
    setDraft((prev) => {
      const copy: DraftCaseType = structuredClone(prev);
      mut(copy);
      return copy;
    });
  }

  function addStage() {
    update((d) => {
      d.stages.push({ id: newId('stage'), name: `Stage ${d.stages.length + 1}`, steps: [] });
    });
  }

  function addStep(stageIdx: number) {
    update((d) => {
      d.stages[stageIdx]!.steps.push({
        id: newId('step'),
        name: 'New step',
        kind: 'form_step',
        assignmentKind: 'specific_role',
        assignmentRole: 'case_worker',
      });
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors([]);
    try {
      const definition = serializeDraft(draft);
      const url = existing ? `/api/case-types/${existing.id}` : '/api/case-types';
      const method = existing ? 'PATCH' : 'POST';
      const body = existing ? { definition } : { name, label, definition };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error?.message ?? 'Save failed.');
        const issues = b?.error?.details?.referenceIssues as Array<{ reason: string }> | undefined;
        if (issues) setFieldErrors(issues.map((i) => i.reason));
        const fieldErrs = b?.error?.details?.fieldErrors;
        if (fieldErrs && typeof fieldErrs === 'object') {
          setFieldErrors(Object.values(fieldErrs).flat() as string[]);
        }
        return;
      }
      const saved = (await res.json()) as { id: string };
      const targetId = existing?.id ?? saved.id;
      router.push(`/studio/case-types/${targetId}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,1fr)]">
      {/* ---- left: form ---- */}
      <div className="flex flex-col gap-4">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Case type
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!existing ? (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Name (identifier)</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="loan_origination"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            ) : null}
            {!existing ? (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Label</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Loan Origination"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            ) : null}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Primary entity</span>
              <select
                value={draft.primaryEntityId}
                onChange={(e) => update((d) => { d.primaryEntityId = e.target.value; })}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Select —</option>
                {context.entities.map((en) => (
                  <option key={en.id} value={en.id}>
                    {en.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Case SLA target (min)</span>
              <input
                type="number"
                value={draft.slaTargetMinutes ?? ''}
                onChange={(e) =>
                  update((d) => {
                    d.slaTargetMinutes = e.target.value ? Number(e.target.value) : undefined;
                  })
                }
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        {draft.stages.map((stage, sIdx) => (
          <StageEditor
            key={stage.id}
            stage={stage}
            stageIndex={sIdx}
            allSteps={allSteps}
            compatibleForms={compatibleForms}
            connectors={context.connectors}
            decisionTables={context.decisionTables}
            onChange={(mut) => update((d) => mut(d.stages[sIdx]!))}
            onAddStep={() => addStep(sIdx)}
            onRemove={() => update((d) => { d.stages.splice(sIdx, 1); })}
          />
        ))}

        <button
          type="button"
          onClick={addStage}
          className="self-start rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
        >
          + Add stage
        </button>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <p className="font-medium">{error}</p>
            {fieldErrors.length > 0 ? (
              <ul className="mt-1 list-disc pl-5">
                {fieldErrors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !draft.primaryEntityId || (!existing && (!name || !label))}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : existing ? 'Save new version' : 'Create case type'}
          </button>
          <span className="self-center text-xs text-muted-foreground">
            Publish from the case type page after saving.
          </span>
        </div>
      </div>

      {/* ---- right: live preview ---- */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Live flow preview
        </h2>
        {preview && !previewError ? (
          <BpmnCanvas definition={preview} />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {previewError ?? 'Add stages and steps to see the flow.'}
          </p>
        )}
      </div>
    </div>
  );
}

interface StageEditorProps {
  stage: DraftStage;
  stageIndex: number;
  allSteps: DraftStep[];
  compatibleForms: DesignerContext['forms'];
  connectors: DesignerContext['connectors'];
  decisionTables: DesignerContext['decisionTables'];
  onChange: (mut: (stage: DraftStage) => void) => void;
  onAddStep: () => void;
  onRemove: () => void;
}

function StageEditor({
  stage,
  allSteps,
  compatibleForms,
  connectors,
  decisionTables,
  onChange,
  onAddStep,
  onRemove,
}: StageEditorProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <input
          value={stage.name}
          onChange={(e) => onChange((s) => { s.name = e.target.value; })}
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium"
        />
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
        >
          Remove stage
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {stage.steps.map((step, stepIdx) => (
          <StepEditor
            key={step.id}
            step={step}
            otherSteps={allSteps.filter((s) => s.id !== step.id)}
            compatibleForms={compatibleForms}
            connectors={connectors}
            decisionTables={decisionTables}
            onChange={(mut) => onChange((s) => mut(s.steps[stepIdx]!))}
            onRemove={() => onChange((s) => { s.steps.splice(stepIdx, 1); })}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddStep}
        className="mt-3 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
      >
        + Add step
      </button>
    </section>
  );
}

interface StepEditorProps {
  step: DraftStep;
  otherSteps: DraftStep[];
  compatibleForms: DesignerContext['forms'];
  connectors: DesignerContext['connectors'];
  decisionTables: DesignerContext['decisionTables'];
  onChange: (mut: (step: DraftStep) => void) => void;
  onRemove: () => void;
}

function StepEditor({
  step,
  otherSteps,
  compatibleForms,
  connectors,
  decisionTables,
  onChange,
  onRemove,
}: StepEditorProps) {
  const userFacing =
    step.kind === 'form_step' || step.kind === 'approval_step';

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <input
          value={step.name}
          onChange={(e) => onChange((s) => { s.name = e.target.value; })}
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
        <select
          value={step.kind}
          onChange={(e) => onChange((s) => { s.kind = e.target.value as StepKind; })}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
        >
          {Object.entries(STEP_KIND_LABELS).map(([k, lbl]) => (
            <option key={k} value={k}>
              {lbl}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {step.kind === 'form_step' ? (
          <Select
            label="Form"
            value={step.formId ?? ''}
            onChange={(v) => onChange((s) => { s.formId = v; })}
            options={compatibleForms.map((f) => ({ value: f.id, label: f.label }))}
          />
        ) : null}

        {step.kind === 'connector_step' ? (
          <>
            <Select
              label="Connector"
              value={step.connectorId ?? ''}
              onChange={(v) => onChange((s) => { s.connectorId = v; })}
              options={connectors.map((c) => ({ value: c.id, label: `${c.label} (${c.kind})` }))}
            />
            <TextArea
              label='Inputs JSON (use "$fieldPath" to reference case data)'
              value={step.connectorInputs ?? ''}
              onChange={(v) => onChange((s) => { s.connectorInputs = v; })}
              placeholder={'{ "method": "GET", "path": "/x/$customer_id" }'}
            />
          </>
        ) : null}

        {step.kind === 'decision_step' ? (
          <>
            <Select
              label="Decision table"
              value={step.decisionTableId ?? ''}
              onChange={(v) => onChange((s) => { s.decisionTableId = v; })}
              options={decisionTables.map((d) => ({ value: d.id, label: d.label }))}
            />
            <TextArea
              label="Inputs JSON (column id → field path)"
              value={step.decisionInputs ?? ''}
              onChange={(v) => onChange((s) => { s.decisionInputs = v; })}
              placeholder={'{ "score": "profile.score" }'}
            />
          </>
        ) : null}

        {step.kind === 'notification_step' ? (
          <>
            <Select
              label="Recipient role"
              value={step.notificationRole ?? ''}
              onChange={(v) => onChange((s) => { s.notificationRole = v; })}
              options={ROLES.map((r) => ({ value: r, label: r }))}
            />
            <Text
              label="Template"
              value={step.notificationTemplate ?? ''}
              onChange={(v) => onChange((s) => { s.notificationTemplate = v; })}
            />
          </>
        ) : null}

        {userFacing ? (
          <Select
            label="Assignment"
            value={step.assignmentKind ?? 'specific_role'}
            onChange={(v) =>
              onChange((s) => {
                s.assignmentKind = v as DraftStep['assignmentKind'];
              })
            }
            options={[
              { value: 'specific_role', label: 'Role' },
              { value: 'manager_of_creator', label: 'Manager of creator' },
              { value: 'current_assignee', label: 'Current assignee' },
            ]}
          />
        ) : null}

        {userFacing && step.assignmentKind === 'specific_role' ? (
          <Select
            label="Role"
            value={step.assignmentRole ?? 'case_worker'}
            onChange={(v) => onChange((s) => { s.assignmentRole = v; })}
            options={ROLES.map((r) => ({ value: r, label: r }))}
          />
        ) : null}

        {step.kind === 'approval_step' ? (
          <>
            <Select
              label="On approve → step"
              value={step.approveTargetStepId ?? ''}
              onChange={(v) => onChange((s) => { s.approveTargetStepId = v || undefined; })}
              options={[
                { value: '', label: 'Resolve case' },
                ...otherSteps.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <Select
              label="On reject → step"
              value={step.rejectTargetStepId ?? ''}
              onChange={(v) => onChange((s) => { s.rejectTargetStepId = v || undefined; })}
              options={[
                { value: '', label: 'Resolve case' },
                ...otherSteps.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </>
        ) : null}

        {userFacing ? (
          <Select
            label="Send-back target (earlier step)"
            value={step.sendBackTargetStepId ?? ''}
            onChange={(v) => onChange((s) => { s.sendBackTargetStepId = v || undefined; })}
            options={[
              { value: '', label: 'None' },
              ...otherSteps.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs sm:col-span-2">
      <span className="font-medium text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs"
      />
    </label>
  );
}
