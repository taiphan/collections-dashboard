import { redirect } from 'next/navigation';
import { requireTenantContext } from '@/lib/tenancy/context';
import * as caseDesigner from '@/lib/services/case-designer';
import * as runtime from '@/lib/services/case-runtime';
import { AppShell } from '@/components/shared/AppShell';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ caseTypeId?: string }>;
}

export default async function NewCasePage({ searchParams }: PageProps) {
  const ctx = await requireTenantContext();
  const sp = await searchParams;

  async function createAction(formData: FormData): Promise<void> {
    'use server';
    const ctx = await requireTenantContext();
    const caseTypeId = String(formData.get('caseTypeId') ?? '');
    const created = await runtime.createCase(ctx, { caseTypeId });
    redirect(`/cases/${created.id}`);
  }

  const caseTypes = await caseDesigner.listCaseTypes(ctx);
  const published = caseTypes.filter((c) => c.publishedVersion != null);

  return (
    <AppShell active="worklist">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Start a new case</h1>
        {published.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No published case types in this workspace. Ask an App Designer to publish one first.
          </p>
        ) : (
          <form action={createAction} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Case type</span>
              <select
                name="caseTypeId"
                defaultValue={sp.caseTypeId ?? published[0]?.id}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              >
                {published.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Create case
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
