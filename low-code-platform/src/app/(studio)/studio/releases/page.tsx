import Link from 'next/link';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import * as service from '@/lib/services/releases';

export const dynamic = 'force-dynamic';

export default async function ReleasesPage() {
  const ctx = await requireTenantContext();
  const items = await service.list(ctx);

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Releases</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Package published artifacts into a Release, then promote to another tenant.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No releases yet.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {items.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between border-b border-border bg-card px-4 py-3 text-sm last:border-b-0"
              >
                <Link href={`/studio/releases/${r.id}`} className="flex-1">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.manifest.artifacts.length} artifact(s) ·{' '}
                    {r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <details className="rounded-xl border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">Build a release</summary>
          <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`POST /api/releases
{
  "name": "v1_2026_01_15",
  "notes": "Loan origination flow",
  "artifacts": [
    { "artifactType": "entity",     "artifactId": "<uuid>" },
    { "artifactType": "form",       "artifactId": "<uuid>" },
    { "artifactType": "case_type",  "artifactId": "<uuid>" }
  ]
}`}
          </pre>
        </details>
      </div>
    </AppShell>
  );
}
