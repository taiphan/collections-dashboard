import Link from 'next/link';
import * as service from '@/lib/services/data-model';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';

export const dynamic = 'force-dynamic';

export default async function DataModelsPage() {
  const ctx = await requireTenantContext();
  const entities = await service.listEntities(ctx);

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Data Models</h1>
          <Link
            href="/studio/data-models/new"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            New entity
          </Link>
        </div>
        {entities.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No entities yet. Create one to start designing forms and case types.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {entities.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between border-b border-border bg-card px-4 py-3 text-sm last:border-b-0"
              >
                <Link href={`/studio/data-models/${e.id}`} className="flex-1">
                  <p className="font-medium text-foreground">{e.label}</p>
                  <p className="text-xs text-muted-foreground">
                    <code>{e.name}</code> · v{e.publishedVersion ?? '—'} ·{' '}
                    {e.updatedAt.toISOString().slice(0, 10)}
                  </p>
                </Link>
                {e.publishedVersion ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Published
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Draft
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
