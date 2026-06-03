import * as service from '@/lib/services/admin';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import { ROLES, hasRole } from '@/lib/rbac/roles';
import { ForbiddenError } from '@/lib/auth/errors';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const ctx = await requireTenantContext();
  if (!hasRole(ctx, ROLES.PLATFORM_ADMIN)) {
    throw new ForbiddenError();
  }
  const members = await service.listMembersAsAdmin(ctx);

  return (
    <AppShell active="admin">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Settings</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <a href="/admin/branding" className="text-primary hover:underline">
                Branding (design tokens) →
              </a>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Members</h2>
          {members.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                  <span className="font-mono text-xs text-muted-foreground">{m.userId.slice(0, 8)}…</span>
                  <span className="flex flex-wrap gap-1">
                    {m.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground"
                      >
                        {r}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            POST to <code>/api/admin/members</code> to invite. PATCH/DELETE on{' '}
            <code>/api/admin/members/[userId]</code> to update roles or revoke.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
