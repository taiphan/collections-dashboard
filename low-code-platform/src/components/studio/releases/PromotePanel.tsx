'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  releaseId: string;
  targets: Array<{ id: string; label: string }>;
  disabled?: boolean;
}

export function PromotePanel({ releaseId, targets, disabled = false }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState(targets[0]?.id ?? '');
  const [confirmText, setConfirmText] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const armed = confirmText === 'PROMOTE' && target && !disabled;

  async function promote(): Promise<void> {
    if (!armed) return;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/releases/${releaseId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTenantId: target }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error?.message ?? 'Promotion failed.');
        return;
      }
      const body = (await res.json()) as { promotedCount: number };
      setResult(`Promoted ${body.promotedCount} artifact(s).`);
      setConfirmText('');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (targets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No other tenants available. Create a target tenant from the Admin page first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Target tenant</span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">
          Type <code>PROMOTE</code> to arm the action
        </span>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          placeholder="PROMOTE"
        />
      </label>
      <button
        type="button"
        onClick={promote}
        disabled={!armed || pending}
        className="self-start rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Promoting…' : 'Promote release'}
      </button>
      {result ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          {result}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
