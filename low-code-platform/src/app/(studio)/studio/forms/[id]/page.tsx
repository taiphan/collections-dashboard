import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import * as service from '@/lib/services/form-designer';
import { HttpError } from '@/lib/auth/errors';
import { PublishButton } from '@/components/studio/PublishButton';
import { FormRenderer } from '@/components/runtime/form-renderer/FormRenderer';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FormDetailPage({ params }: Props) {
  const ctx = await requireTenantContext();
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof service.getForm>>;
  try {
    detail = await service.getForm(ctx, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }
  const def = detail.latestDefinition ?? detail.publishedDefinition;
  const latestVersion = detail.summary.publishedVersion ?? 1;

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Form</p>
            <h1 className="text-xl font-semibold tracking-tight">{detail.summary.label}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              <code>{detail.summary.name}</code> · published v{detail.summary.publishedVersion ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/studio/forms/${id}/edit`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              Edit
            </Link>
            <PublishButton
              endpoint={`/api/forms/${id}/publish`}
              version={latestVersion}
              alreadyPublished={detail.summary.publishedVersion === latestVersion}
            />
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </h2>
          <div className="mt-3">
            {def ? (
              <FormRenderer definition={def} onSubmit={() => {}} noSubmit />
            ) : (
              <p className="text-sm text-muted-foreground">No definition.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
