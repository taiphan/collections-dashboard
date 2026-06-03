'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export interface TenantOption {
  tenantId: string;
  subdomain: string;
  name: string;
}

interface TenantSwitcherProps {
  tenants: TenantOption[];
  activeTenantId: string;
  /** When true, switching sets a cookie and refreshes; otherwise navigates to subdomain. */
  useCookieSwitch: boolean;
  rootDomain: string;
}

export function TenantSwitcher({
  tenants,
  activeTenantId,
  useCookieSwitch,
  rootDomain,
}: TenantSwitcherProps): React.ReactElement | null {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (tenants.length <= 1) {
    const only = tenants[0];
    if (!only) return null;
    return (
      <span className="max-w-[12rem] truncate text-sm font-medium text-foreground" title={only.name}>
        {only.name}
      </span>
    );
  }

  async function onChange(nextId: string): Promise<void> {
    if (nextId === activeTenantId) return;
    setError(null);
    const target = tenants.find((t) => t.tenantId === nextId);
    if (!target) return;

    if (!useCookieSwitch) {
      const { pathname, search, port } = window.location;
      const host = port
        ? `${target.subdomain}.${rootDomain}:${port}`
        : `${target.subdomain}.${rootDomain}`;
      window.location.assign(`//${host}${pathname}${search}`);
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/tenant/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: nextId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(body?.error?.message ?? 'Could not switch tenant.');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <label className="sr-only" htmlFor="tenant-switcher">
        Active tenant
      </label>
      <select
        id="tenant-switcher"
        value={activeTenantId}
        disabled={pending}
        onChange={(e) => void onChange(e.target.value)}
        className="max-w-[14rem] truncate rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        aria-label="Active tenant"
      >
        {tenants.map((t) => (
          <option key={t.tenantId} value={t.tenantId}>
            {t.name}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
