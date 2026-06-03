import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import * as service from '@/lib/services/releases';
import * as tenantRepo from '@/lib/db/repositories/tenants';
import { ROLES, hasRole } from '@/lib/rbac/roles';
import { ForbiddenError, NotFoundError } from '@/lib/auth/errors';
import { PromotePanel } from '@/components/studio/releases/PromotePanel';
import { ApprovalPanel } from '@/components/studio/releases/ApprovalPanel';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const statusStyle: Record<string, string> = {
  draft: 'bg-secondary text-foreground',
  approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  promoted: 'bg-primary/10 text-primary',
};

export default async function ReleaseDetailPage({ params }: Props) {
  const ctx = await requireTenantContext();
  if (!hasRole(ctx, ROLES.PLATFORM_ADMIN)) throw new ForbiddenError();
  const { id } = await params;

  const all = await service.list(ctx);
  const release = all.find((r) => r.id === id);
  if (!release) {
    throw new NotFoundError();
  }

  const approvals = await service.listApprovals(ctx, id);
  const approveCount = approvals.filter((a) => a.decision === 'approve').length;
  const required = release.approvalPolicy === 'dual' ? 2 : release.approvalPolicy === 'single' ? 1 : 0;
  const gateMet = release.approvalPolicy === 'none' || release.status === 'approved';

  const tenants = (await tenantRepo.listAll()).filter((t) => t.id !== ctx.tenantId);

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Release</p>
            <h1 className="text-xl font-semibold tracking-tight">{release.name}</h1>
            {release.manifest.notes ? (
              <p className="mt-1 text-sm text-muted-foreground">{release.manifest.notes}</p>
            ) : null}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle[release.status] ?? 'bg-secondary'}`}
          >
            {release.status}
          </span>
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Artifacts</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {release.manifest.artifacts.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
              >
                <span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{a.artifactType}</span>{' '}
                  <span className="font-medium text-foreground">{a.label}</span>{' '}
                  <span className="text-muted-foreground">({a.name})</span>
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs">v{a.version}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Approvals
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Policy: <strong>{release.approvalPolicy}</strong>
            {required > 0 ? ` · ${approveCount}/${required} approvals` : ' · no approval required'}
          </p>
          {approvals.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {approvals.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                >
                  <span className="font-mono text-xs text-muted-foreground">{a.approverUserId.slice(0, 8)}…</span>
                  <span
                    className={
                      a.decision === 'approve'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-destructive'
                    }
                  >
                    {a.decision}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {release.approvalPolicy !== 'none' && release.status !== 'promoted' ? (
            <div className="mt-3">
              <ApprovalPanel releaseId={release.id} />
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Promote</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Re-creates each artifact in the target tenant. Existing cases stay pinned to their current versions.
          </p>
          {!gateMet ? (
            <p className="mt-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
              This release needs {release.approvalPolicy} approval before it can be promoted.
            </p>
          ) : null}
          <div className="mt-3">
            <PromotePanel
              releaseId={release.id}
              disabled={!gateMet}
              targets={tenants.map((t) => ({ id: t.id, label: `${t.name} (${t.subdomain})` }))}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
