import * as service from '@/lib/services/manager-dashboard';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const ctx = await requireTenantContext();
  const snapshot = await service.getDashboard(ctx);

  return (
    <AppShell active="dashboard">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <h1 className="text-xl font-semibold tracking-tight">Manager Dashboard</h1>

        <Tile title="Cases by stage">
          {snapshot.cardsPerStage.length === 0 ? (
            <Empty />
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.cardsPerStage.map((c) => (
                <li
                  key={`${c.key.caseTypeId}-${c.key.stageId}`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                >
                  <span className="text-sm text-foreground">{c.label}</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs font-semibold">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <Tile title="SLA distribution">
          <ul className="grid grid-cols-3 gap-2">
            {snapshot.cardsPerSla.map((c) => (
              <li
                key={String(c.key)}
                className={
                  'rounded-md border px-3 py-2 ' +
                  (c.key === 'breached'
                    ? 'border-destructive/40 bg-destructive/5'
                    : c.key === 'warning'
                      ? 'border-yellow-500/40 bg-yellow-500/5'
                      : 'border-emerald-500/40 bg-emerald-500/5')
                }
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-semibold">{c.count}</p>
              </li>
            ))}
          </ul>
        </Tile>

        <Tile title="Workload per assignee">
          {snapshot.cardsPerAssignee.length === 0 ? (
            <Empty />
          ) : (
            <ul className="flex flex-col gap-1">
              {snapshot.cardsPerAssignee.map((c) => (
                <li
                  key={c.key.userId}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{c.label.slice(0, 8)}…</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs font-semibold">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <p className="text-xs text-muted-foreground">
          Generated at {new Date(snapshot.generatedAt).toLocaleString()}
        </p>
      </div>
    </AppShell>
  );
}

function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">No data yet.</p>;
}
