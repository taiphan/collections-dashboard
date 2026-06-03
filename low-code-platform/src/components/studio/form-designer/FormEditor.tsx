'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormRenderer } from '@/components/runtime/form-renderer/FormRenderer';
import {
  formComponentFieldCompatibility,
  type FieldDefinition,
  type FieldKind,
} from '@/lib/validation/entity';
import type { FormComponent, FormDefinition } from '@/lib/validation/form';

interface EntityChoice {
  id: string;
  label: string;
  fields: FieldDefinition[];
}

interface Props {
  entities: EntityChoice[];
  existing?: { id: string; name: string; label: string; definition: FormDefinition };
}

type FieldBoundKind = Exclude<FormComponent['kind'], 'label' | 'section'>;

const COMPONENT_KIND_LABELS: Record<FormComponent['kind'], string> = {
  text_input: 'Text input',
  number_input: 'Number input',
  date_picker: 'Date',
  datetime_picker: 'Datetime',
  boolean_toggle: 'Boolean',
  select: 'Select',
  lookup: 'Lookup',
  table: 'Table',
  file_upload: 'File',
  label: 'Label',
  section: 'Section',
};

function componentsForFieldKind(kind: FieldKind): FormComponent['kind'][] {
  return Object.entries(formComponentFieldCompatibility)
    .filter(([, kinds]) => kinds.includes(kind))
    .map(([k]) => k as FormComponent['kind']);
}

function newId(): string {
  return crypto.randomUUID();
}

export function FormEditor({ entities, existing }: Props) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [entityId, setEntityId] = useState(existing?.definition.entityId ?? entities[0]?.id ?? '');
  const [components, setComponents] = useState<FormComponent[]>(
    existing?.definition.components ?? [],
  );
  const [rootIds, setRootIds] = useState<string[]>(
    existing?.definition.rootComponentIds ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});

  const entity = useMemo(() => entities.find((e) => e.id === entityId), [entities, entityId]);

  const definition: FormDefinition = useMemo(
    () => ({
      entityId,
      rootComponentIds: rootIds,
      components,
    }),
    [entityId, rootIds, components],
  );

  function addComponentForField(field: FieldDefinition): void {
    const kindOptions = componentsForFieldKind(field.kind);
    const kind = kindOptions[0];
    if (!kind) return;
    const id = newId();
    const base = {
      id,
      label: field.label,
      validation: field.required ? [{ kind: 'required' as const }] : undefined,
    };
    let comp: FormComponent;
    if (kind === 'label' || kind === 'section') {
      // Should not happen because compatibility table excludes them.
      return;
    }
    comp = { ...base, kind: kind as FieldBoundKind, fieldPath: field.name } as FormComponent;
    if (kind === 'table') {
      comp = { ...base, kind: 'table', fieldPath: field.name, columns: [] } as FormComponent;
    }
    setComponents((prev) => [...prev, comp]);
    setRootIds((prev) => [...prev, id]);
  }

  function addLabel(): void {
    const id = newId();
    setComponents((prev) => [...prev, { id, kind: 'label', text: 'Label' }]);
    setRootIds((prev) => [...prev, id]);
  }

  function removeComponent(id: string): void {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setRootIds((prev) => prev.filter((x) => x !== id));
  }

  function move(id: string, dir: -1 | 1): void {
    setRootIds((prev) => {
      const idx = prev.indexOf(id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      next.splice(target, 0, removed!);
      return next;
    });
  }

  function updateComponent(id: string, mut: (c: FormComponent) => void): void {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const copy = structuredClone(c);
        mut(copy);
        return copy;
      }),
    );
  }

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const url = existing ? `/api/forms/${existing.id}` : '/api/forms';
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
        return;
      }
      const saved = (await res.json()) as { id?: string };
      const targetId = existing?.id ?? saved.id;
      router.push(`/studio/forms/${targetId}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const componentsById = useMemo(
    () => new Map(components.map((c) => [c.id, c])),
    [components],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,1fr)]">
      {/* ---- left: editor ---- */}
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
                    placeholder="loan_intake"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Label</span>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Loan Intake"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </label>
              </>
            ) : null}
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Bound entity</span>
              <select
                value={entityId}
                onChange={(e) => {
                  setEntityId(e.target.value);
                  setComponents([]);
                  setRootIds([]);
                }}
                disabled={!!existing}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="">— Select —</option>
                {entities.map((en) => (
                  <option key={en.id} value={en.id}>
                    {en.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Field palette */}
        {entity ? (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Add components
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {entity.fields.map((f) => {
                const used = components.some(
                  (c) => 'fieldPath' in c && (c as { fieldPath: string }).fieldPath === f.name,
                );
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addComponentForField(f)}
                    disabled={used}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-40"
                  >
                    + {f.label}
                    <span className="ml-1 text-muted-foreground">({f.kind})</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={addLabel}
                className="rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary"
              >
                + Label
              </button>
            </div>
          </section>
        ) : null}

        {/* Layout list */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Layout ({rootIds.length})
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {rootIds.map((id, idx) => {
              const c = componentsById.get(id);
              if (!c) return null;
              return (
                <li
                  key={id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {COMPONENT_KIND_LABELS[c.kind]}
                    </span>
                    <span className="flex-1 text-sm font-medium">
                      {c.kind === 'label' ? c.text : 'label' in c ? c.label : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => move(id, -1)}
                      disabled={idx === 0}
                      className="rounded-md px-2 py-1 text-xs hover:bg-secondary disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(id, 1)}
                      disabled={idx === rootIds.length - 1}
                      className="rounded-md px-2 py-1 text-xs hover:bg-secondary disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeComponent(id)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                      aria-label="Remove component"
                    >
                      ✕
                    </button>
                  </div>

                  {c.kind === 'label' ? (
                    <input
                      value={c.text}
                      onChange={(e) =>
                        updateComponent(id, (x) => {
                          if (x.kind === 'label') x.text = e.target.value;
                        })
                      }
                      className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    />
                  ) : 'label' in c ? (
                    <input
                      value={c.label}
                      onChange={(e) =>
                        updateComponent(id, (x) => {
                          if ('label' in x) x.label = e.target.value;
                        })
                      }
                      placeholder="Label"
                      className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
          {rootIds.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {entity ? 'Click a field above to add it.' : 'Pick a bound entity first.'}
            </p>
          ) : null}
        </section>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={save}
          disabled={
            saving ||
            !entityId ||
            rootIds.length === 0 ||
            (!existing && (!name || !label))
          }
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : existing ? 'Save new version' : 'Create form'}
        </button>
      </div>

      {/* ---- right: live preview ---- */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Live preview
        </h2>
        <div className="rounded-xl border border-border bg-card p-4">
          {rootIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add components to preview.</p>
          ) : (
            <FormRenderer
              definition={definition}
              initialValues={previewValues}
              onSubmit={(values) => {
                setPreviewValues(values);
              }}
              submitLabel="Preview submit"
            />
          )}
        </div>
      </div>
    </div>
  );
}
