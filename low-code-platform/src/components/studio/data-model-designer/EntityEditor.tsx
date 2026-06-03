'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EntityDefinition, FieldKind } from '@/lib/validation/entity';

interface DraftField {
  id: string;
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  options?: string; // comma-separated for select
  lookupEntityId?: string;
  childRelationship?: string;
}

interface Props {
  entityOptions: Array<{ id: string; label: string }>;
  existing?: { id: string; name: string; label: string; fields: DraftField[] };
}

const FIELD_KINDS: FieldKind[] = [
  'text',
  'number',
  'date',
  'datetime',
  'boolean',
  'select',
  'lookup',
  'table',
  'file',
];

function uuid(): string {
  return crypto.randomUUID();
}

export function EntityEditor({ entityOptions, existing }: Props) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [fields, setFields] = useState<DraftField[]>(
    existing?.fields ?? [
      { id: uuid(), name: 'name', label: 'Name', kind: 'text', required: true },
    ],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  function updateField(idx: number, mut: (f: DraftField) => void) {
    setFields((prev) => {
      const copy = structuredClone(prev);
      mut(copy[idx]!);
      return copy;
    });
  }

  function addField() {
    setFields((prev) => [
      ...prev,
      { id: uuid(), name: `field_${prev.length + 1}`, label: 'New field', kind: 'text', required: false },
    ]);
  }

  function buildDefinition(): EntityDefinition {
    return {
      fields: fields.map((f) => {
        const base = { id: f.id, name: f.name, label: f.label, required: f.required };
        switch (f.kind) {
          case 'select':
            return {
              ...base,
              kind: 'select' as const,
              options: (f.options ?? '')
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean),
            };
          case 'lookup':
            return { ...base, kind: 'lookup' as const, lookupEntityId: f.lookupEntityId ?? '' };
          case 'table':
            return {
              ...base,
              kind: 'table' as const,
              childRelationship: f.childRelationship ?? 'children',
            };
          case 'number':
            return { ...base, kind: 'number' as const, integer: false };
          default:
            return { ...base, kind: f.kind } as EntityDefinition['fields'][number];
        }
      }),
      relationships: [],
    };
  }

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors([]);
    try {
      const definition = buildDefinition();
      const url = existing ? `/api/entities/${existing.id}` : '/api/entities';
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
        const fe = b?.error?.details?.fieldErrors;
        if (fe && typeof fe === 'object') setFieldErrors(Object.values(fe).flat() as string[]);
        return;
      }
      const saved = (await res.json()) as { id?: string };
      const targetId = existing?.id ?? saved.id;
      router.push(`/studio/data-models/${targetId}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!existing ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Name (identifier)</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="loan_application"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Label</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Loan Application"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </>
          ) : (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Editing <strong>{existing.label}</strong> — saving creates a new version.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fields</h2>
        <div className="mt-3 flex flex-col gap-2">
          {fields.map((f, idx) => (
            <div key={f.id} className="rounded-lg border border-border bg-background p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-muted-foreground">Name</span>
                  <input
                    value={f.name}
                    onChange={(e) => updateField(idx, (x) => { x.name = e.target.value; })}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-muted-foreground">Label</span>
                  <input
                    value={f.label}
                    onChange={(e) => updateField(idx, (x) => { x.label = e.target.value; })}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-muted-foreground">Type</span>
                  <select
                    value={f.kind}
                    onChange={(e) => updateField(idx, (x) => { x.kind = e.target.value as FieldKind; })}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    {FIELD_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updateField(idx, (x) => { x.required = e.target.checked; })}
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {f.kind === 'select' ? (
                <label className="mt-2 flex flex-col gap-1 text-xs">
                  <span className="font-medium text-muted-foreground">Options (comma-separated)</span>
                  <input
                    value={f.options ?? ''}
                    onChange={(e) => updateField(idx, (x) => { x.options = e.target.value; })}
                    placeholder="low, medium, high"
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </label>
              ) : null}

              {f.kind === 'lookup' ? (
                <label className="mt-2 flex flex-col gap-1 text-xs">
                  <span className="font-medium text-muted-foreground">Referenced entity</span>
                  <select
                    value={f.lookupEntityId ?? ''}
                    onChange={(e) => updateField(idx, (x) => { x.lookupEntityId = e.target.value; })}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="">— Select —</option>
                    {entityOptions.map((en) => (
                      <option key={en.id} value={en.id}>
                        {en.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {f.kind === 'table' ? (
                <label className="mt-2 flex flex-col gap-1 text-xs">
                  <span className="font-medium text-muted-foreground">Child relationship name</span>
                  <input
                    value={f.childRelationship ?? ''}
                    onChange={(e) => updateField(idx, (x) => { x.childRelationship = e.target.value; })}
                    placeholder="line_items"
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </label>
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addField}
          className="mt-3 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
        >
          + Add field
        </button>
      </section>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <p className="font-medium">{error}</p>
          {fieldErrors.length > 0 ? (
            <ul className="mt-1 list-disc pl-5">
              {fieldErrors.map((fe, i) => (
                <li key={i}>{fe}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={saving || (!existing && (!name || !label)) || fields.length === 0}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving…' : existing ? 'Save new version' : 'Create entity'}
      </button>
    </div>
  );
}
