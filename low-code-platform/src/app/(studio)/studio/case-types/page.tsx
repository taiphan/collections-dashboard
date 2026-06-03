import Link from 'next/link';
import * as service from '@/lib/services/case-designer';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';

export const dynamic = 'force-dynamic';

export default async function CaseTypesPage() {
  const ctx = await requireTenantContext();
  const caseTypes = await service.listCaseTypes(ctx);

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Case Types</h1>
          <Link
            href="/studio/case-types/new"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            New case type
          </Link>
        </div>
        {caseTypes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No case types yet. POST to <code>/api/case-types</code> to create one.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {caseTypes.map((ct) => (
              <li
                key={ct.id}
                className="flex items-center justify-between border-b border-border bg-card px-4 py-3 text-sm last:border-b-0"
              >
                <Link href={`/studio/case-types/${ct.id}`} className="flex-1">
                  <p className="font-medium text-foreground">{ct.label}</p>
                  <p className="text-xs text-muted-foreground">
                    <code>{ct.name}</code> · v{ct.publishedVersion ?? '—'}
                  </p>
                </Link>
                <Link
                  href={`/cases/new?caseTypeId=${ct.id}`}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  Start case
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
