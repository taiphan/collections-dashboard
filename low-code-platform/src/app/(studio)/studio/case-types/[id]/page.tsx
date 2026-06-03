import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireTenantContext } from '@/lib/tenancy/context';
import * as service from '@/lib/services/case-designer';
import { HttpError } from '@/lib/auth/errors';
import { AppShell } from '@/components/shared/AppShell';
import { BpmnCanvas } from '@/components/studio/case-type-designer/BpmnCanvas';
import { PublishButton } from '@/components/studio/PublishButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CaseTypeDetailPage({ params }: Props) {
  const ctx = await requireTenantContext();
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof service.getCaseType>>;
  try {
    detail = await service.getCaseType(ctx, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }

  const def = detail.publishedDefinition ?? detail.latestDefinition;
  // The latest version number is needed for the publish control; it's the
  // published version if set, else the highest existing version (1 for new).
  const latestVersion = detail.summary.publishedVersion ?? 1;

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Case type</p>
            <h1 className="text-xl font-semibold tracking-tight">{detail.summary.label}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              <code>{detail.summary.name}</code> · published v{detail.summary.publishedVersion ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/studio/case-types/${id}/edit`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              Edit
            </Link>
            <PublishButton
              endpoint={`/api/case-types/${id}/publish`}
              version={latestVersion}
              alreadyPublished={detail.summary.publishedVersion === latestVersion}
            />
          </div>
        </div>
        {def ? (
          <BpmnCanvas definition={def} />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No definition yet.
          </p>
        )}
      </div>
    </AppShell>
  );
}
