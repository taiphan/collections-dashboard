import Link from 'next/link';
import type { ReactNode } from 'react';
import { TenantTheme } from '@/components/shared/TenantTheme';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { TenantSwitcher } from '@/components/shared/TenantSwitcher';
import { auth } from '@/lib/auth/config';
import * as tenantsRepo from '@/lib/db/repositories/tenants';
import { headers } from 'next/headers';
import { requireTenantContext } from '@/lib/tenancy/context';
import { extractSubdomain } from '@/lib/tenancy/resolver';

interface AppShellProps {
  active: 'studio' | 'worklist' | 'dashboard' | 'admin';
  children: ReactNode;
}

const NAV = [
  { id: 'worklist', href: '/worklist', label: 'Worklist' },
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard' },
  { id: 'studio', href: '/studio', label: 'Studio' },
  { id: 'admin', href: '/admin', label: 'Admin' },
] as const;

export async function AppShell({ active, children }: AppShellProps) {
  const ctx = await requireTenantContext();
  const session = await auth();
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? 'lcp.localhost';
  const host = (await headers()).get('host') ?? '';
  const onTenantSubdomain = extractSubdomain(host, rootDomain) !== null;
  const useCookieSwitch = process.env.NODE_ENV !== 'production' && !onTenantSubdomain;

  const tenantOptions = await Promise.all(
    (session?.memberships ?? []).map(async (m) => {
      const row = await tenantsRepo.getById(m.tenantId);
      return {
        tenantId: m.tenantId,
        subdomain: row?.subdomain ?? '',
        name: row?.name ?? m.tenantId,
      };
    }),
  );

  return (
    <TenantTheme tenantId={ctx.tenantId}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Low-Code Platform
          </span>
          <nav className="ml-4 flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={
                  'rounded-md px-3 py-1.5 transition ' +
                  (active === item.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <TenantSwitcher
              tenants={tenantOptions}
              activeTenantId={ctx.tenantId}
              useCookieSwitch={useCookieSwitch}
              rootDomain={rootDomain}
            />
            <NotificationBell />
            <Link href="/api/auth/signout" className="hover:text-foreground">
              Sign out
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </TenantTheme>
  );
}
