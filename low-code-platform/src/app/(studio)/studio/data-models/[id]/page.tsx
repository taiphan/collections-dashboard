import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import * as dataModel from '@/lib/services/data-model';
import { HttpError } from '@/lib/auth/errors';
import { PublishButton } from '@/components/studio/PublishButton';
import type { EntityDefinition } from '@/lib/validation/entity';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EntityDetailPage({ params }: Props) {
  const ctx = await requireTenantContext();
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof dataModel.getEntity>>;
  try {
    detail = await dataModel.getEntity(ctx, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }

  const def = (detail.latestDefinition ?? detail.publishedDefinition) as EntityDefinition | null;
  const latestVersion = detail.summary.publishedVersion ?? 1;

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Entity</p>
            <h1 className="text-xl font-semibold tracking-tight">{detail.summary.label}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              <code>{detail.summary.name}</code> · published v{detail.summary.publishedVersion ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/studio/data-models/${id}/edit`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              Edit
            </Link>
            <PublishButton
              endpoint={`/api/entities/${id}/publish`}
              version={latestVersion}
              alreadyPublished={detail.summary.publishedVersion === latestVersion}
            />
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Field</th>
                <th className="px-3 py-2">Identifier</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Required</th>
              </tr>
            </thead>
            <tbody>
              {def?.fields.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{f.label}</td>
                  <td className="px-3 py-2 text-muted-foreground"><code>{f.name}</code></td>
                  <td className="px-3 py-2">{f.kind}</td>
                  <td className="px-3 py-2 text-muted-foreground">{f.required ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
