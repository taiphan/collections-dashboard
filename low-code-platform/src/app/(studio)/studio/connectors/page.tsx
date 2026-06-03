import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import * as service from '@/lib/services/connectors';

export const dynamic = 'force-dynamic';

export default async function ConnectorsPage() {
  const ctx = await requireTenantContext();
  const items = await service.list(ctx);

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Connectors</h1>
          <span className="text-xs text-muted-foreground">
            POST <code>/api/connectors</code> to create one
          </span>
        </div>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No connectors yet. The REST adapter is ready; create a connector to get started.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border-b border-border bg-card px-4 py-3 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-medium text-foreground">{c.label}</p>
                  <p className="text-xs text-muted-foreground">
                    <code>{c.name}</code> · kind: {c.kind}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                  {c.kind}
                </span>
              </li>
            ))}
          </ul>
        )}

        <details className="rounded-xl border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">
            REST connector example
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
{`POST /api/connectors
{
  "name": "users_api",
  "label": "Users API",
  "kind": "rest",
  "config": {
    "baseUrl": "https://api.example.com",
    "timeoutMs": 8000
  }
}`}
          </pre>
        </details>
      </div>
    </AppShell>
  );
}
