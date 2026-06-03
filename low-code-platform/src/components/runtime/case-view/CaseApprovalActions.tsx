'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CaseApprovalActions({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'approve' | 'reject'): Promise<void> {
    setPending(decision);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? 'Failed.');
        return;
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="button"
        onClick={() => decide('approve')}
        disabled={pending !== null}
        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending === 'approve' ? 'Approving…' : 'Approve'}
      </button>
      <button
        type="button"
        onClick={() => decide('reject')}
        disabled={pending !== null}
        className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
      >
        {pending === 'reject' ? 'Rejecting…' : 'Reject'}
      </button>
    </div>
  );
}
