import * as service from '@/lib/services/form-designer';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';

export const dynamic = 'force-dynamic';

export default async function FormsPage() {
  const ctx = await requireTenantContext();
  const forms = await service.listForms(ctx);

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Forms</h1>
        {forms.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No forms yet. POST to <code>/api/forms</code> to create one.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {forms.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between border-b border-border bg-card px-4 py-3 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">
                    <code>{f.name}</code> · v{f.publishedVersion ?? '—'} · entity {f.entityId.slice(0, 8)}
                  </p>
                </div>
                {f.publishedVersion ? (
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
