import { notFound } from 'next/navigation';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import * as service from '@/lib/services/decision-tables';
import { HttpError } from '@/lib/auth/errors';
import type { DecisionTableDefinition } from '@/lib/validation/decision-table';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DecisionTableDetailPage({ params }: Props) {
  const ctx = await requireTenantContext();
  const { id } = await params;
  let row: Awaited<ReturnType<typeof service.getById>>;
  try {
    row = await service.getById(ctx, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }
  const def = row.definition as DecisionTableDefinition;

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Decision table</p>
          <h1 className="text-xl font-semibold tracking-tight">{row.label}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            <code>{row.name}</code>
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {def.inputs.map((c) => (
                  <th key={c.id} className="px-3 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </th>
                ))}
                <th className="border-l border-border px-3 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  →
                </th>
                {def.outputs.map((c) => (
                  <th key={c.id} className="px-3 py-2 text-left text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {def.rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  {def.inputs.map((c) => (
                    <td key={c.id} className="px-3 py-2">
                      <CellLabel cell={row.conditions[c.id]} />
                    </td>
                  ))}
                  <td className="border-l border-border px-3 py-2 text-muted-foreground">→</td>
                  {def.outputs.map((c) => (
                    <td key={c.id} className="px-3 py-2 font-medium">
                      {String(row.outputs[c.id] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
              {def.defaultOutputs ? (
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={def.inputs.length} className="px-3 py-2 text-xs italic text-muted-foreground">
                    default
                  </td>
                  <td className="border-l border-border px-3 py-2 text-muted-foreground">→</td>
                  {def.outputs.map((c) => (
                    <td key={c.id} className="px-3 py-2 font-medium">
                      {String(def.defaultOutputs![c.id] ?? '')}
                    </td>
                  ))}
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

import type { DecisionCell } from '@/lib/validation/decision-table';

function CellLabel({ cell }: { cell?: DecisionCell }) {
  if (!cell) return <span className="text-muted-foreground">—</span>;
  switch (cell.op) {
    case 'any':
      return <span className="text-muted-foreground">any</span>;
    case '==':
      return <span>= {String(cell.value)}</span>;
    case '!=':
      return <span>≠ {String(cell.value)}</span>;
    case '<':
      return <span>&lt; {cell.value}</span>;
    case '<=':
      return <span>≤ {cell.value}</span>;
    case '>':
      return <span>&gt; {cell.value}</span>;
    case '>=':
      return <span>≥ {cell.value}</span>;
    case 'in':
      return <span>in [{cell.value.map(String).join(', ')}]</span>;
    case 'between':
      return <span>{cell.min} – {cell.max}</span>;
  }
}
