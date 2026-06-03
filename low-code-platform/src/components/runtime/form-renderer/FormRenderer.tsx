'use client';

import { useMemo, useState } from 'react';
import type { FormComponent, FormDefinition } from '@/lib/validation/form';
import { computeVisibility } from '@/lib/form-runtime/visibility';
import { validateValues, type FieldError } from '@/lib/form-runtime/validation';

interface FormRendererProps {
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  /** Hide the submit button (designer preview). */
  noSubmit?: boolean;
}

export function FormRenderer({
  definition,
  initialValues,
  onSubmit,
  submitLabel = 'Submit',
  noSubmit = false,
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues ?? {});
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const visibleIds = useMemo(() => computeVisibility(definition, values), [definition, values]);
  const byId = useMemo(
    () => new Map<string, FormComponent>(definition.components.map((c) => [c.id, c])),
    [definition],
  );
  const errorByComponent = useMemo(() => {
    const map = new Map<string, string>();
    errors.forEach((e) => map.set(e.componentId, e.message));
    return map;
  }, [errors]);

  function setFieldValue(fieldPath: string, value: unknown): void {
    setValues((prev) => ({ ...prev, [fieldPath]: value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const issues = validateValues(definition, values, visibleIds);
    setErrors(issues);
    if (issues.length > 0) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  function renderNode(id: string): React.ReactNode {
    const c = byId.get(id);
    if (!c || !visibleIds.has(c.id)) return null;
    const error = errorByComponent.get(c.id);
    return (
      <ComponentNode
        key={c.id}
        component={c}
        value={'fieldPath' in c ? values[c.fieldPath] : undefined}
        error={error}
        onChange={(v) => 'fieldPath' in c && setFieldValue(c.fieldPath, v)}
        renderChild={renderNode}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {definition.rootComponentIds.map((id) => renderNode(id))}
      {!noSubmit ? (
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : submitLabel}
        </button>
      ) : null}
    </form>
  );
}

interface ComponentNodeProps {
  component: FormComponent;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  renderChild: (id: string) => React.ReactNode;
}

function ComponentNode({ component, value, error, onChange, renderChild }: ComponentNodeProps) {
  const labelId = `${component.id}-label`;
  switch (component.kind) {
    case 'label':
      return (
        <p id={labelId} className="text-sm font-medium text-foreground">
          {component.text}
        </p>
      );
    case 'section':
      return (
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium text-foreground">{component.title}</legend>
          <div className="flex flex-col gap-3 pt-2">
            {component.childIds.map((childId) => renderChild(childId))}
          </div>
        </fieldset>
      );
    case 'text_input':
      return (
        <FieldShell label={component.label} id={component.id} error={error}>
          <input
            id={component.id}
            type="text"
            value={(value as string) ?? ''}
            placeholder={component.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FieldShell>
      );
    case 'number_input':
      return (
        <FieldShell label={component.label} id={component.id} error={error}>
          <input
            id={component.id}
            type="number"
            value={(value as number | undefined) ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FieldShell>
      );
    case 'date_picker':
      return (
        <FieldShell label={component.label} id={component.id} error={error}>
          <input
            id={component.id}
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FieldShell>
      );
    case 'datetime_picker':
      return (
        <FieldShell label={component.label} id={component.id} error={error}>
          <input
            id={component.id}
            type="datetime-local"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FieldShell>
      );
    case 'boolean_toggle':
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            id={component.id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="font-medium text-foreground">{component.label}</span>
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
        </label>
      );
    case 'select':
      return (
        <FieldShell label={component.label} id={component.id} error={error}>
          <select
            id={component.id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">— Select —</option>
            {/* options come from the bound entity field; designer hands them in via the form definition. */}
            {(component as Extract<FormComponent, { kind: 'select' }>).validation
              ?.filter((v) => v.kind === 'custom')
              .map((v, i) => (
                <option key={i} value={String(v.params?.value ?? '')}>
                  {String(v.params?.label ?? v.params?.value ?? '')}
                </option>
              ))}
          </select>
        </FieldShell>
      );
    case 'lookup':
      return (
        <FieldShell label={component.label} id={component.id} error={error}>
          <input
            id={component.id}
            type="text"
            value={(value as string) ?? ''}
            placeholder="Lookup id"
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lookup picker UI ships in a follow-up; for now, paste the target id.
          </p>
        </FieldShell>
      );
    case 'table':
      return (
        <FieldShell label={component.label} id={component.id} error={error}>
          <p className="text-xs text-muted-foreground">
            Table editor ships in a follow-up. Bound to relationship{' '}
            <code className="rounded bg-muted px-1 py-0.5">{component.fieldPath}</code>.
          </p>
        </FieldShell>
      );
    case 'file_upload':
      return (
        <FieldShell label={component.label} id={component.id} error={error}>
          <input
            id={component.id}
            type="file"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </FieldShell>
      );
  }
}

function FieldShell({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
