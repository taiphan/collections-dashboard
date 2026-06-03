'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ApprovalPanel({ releaseId }: { releaseId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'approve' | 'reject'): Promise<void> {
    setPending(decision);
    setError(null);
    try {
      const res = await fetch(`/api/releases/${releaseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment: comment || undefined }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error?.message ?? 'Failed.');
        return;
      }
      setComment('');
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-3">
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comment (optional)"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => decide('approve')}
          disabled={pending !== null}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => decide('reject')}
          disabled={pending !== null}
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
        >
          {pending === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}
