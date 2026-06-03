import Link from 'next/link';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import * as service from '@/lib/services/decision-tables';

export const dynamic = 'force-dynamic';

export default async function DecisionTablesPage() {
  const ctx = await requireTenantContext();
  const items = await service.list(ctx);

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Decision Tables</h1>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No decision tables yet. POST a table definition to <code>/api/decision-tables</code>.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {items.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border-b border-border bg-card px-4 py-3 text-sm last:border-b-0"
              >
                <Link href={`/studio/decision-tables/${d.id}`} className="flex-1">
                  <p className="font-medium text-foreground">{d.label}</p>
                  <p className="text-xs text-muted-foreground">
                    <code>{d.name}</code>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <details className="rounded-xl border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">Decision table example</summary>
          <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
{`POST /api/decision-tables
{
  "name": "loan_routing",
  "label": "Loan routing",
  "definition": {
    "inputs": [
      { "id": "amount", "label": "Amount", "type": "number" },
      { "id": "priority", "label": "Priority", "type": "text" }
    ],
    "outputs": [{ "id": "route", "label": "Route", "type": "text" }],
    "rows": [
      {
        "id": "fast",
        "conditions": {
          "amount": { "op": "between", "min": 100, "max": 1000 },
          "priority": { "op": "==", "value": "high" }
        },
        "outputs": { "route": "fast_track" }
      }
    ],
    "defaultOutputs": { "route": "manual" }
  }
}`}
          </pre>
        </details>
      </div>
    </AppShell>
  );
}
