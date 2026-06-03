'use client';

import { useEffect, useState } from 'react';

interface Comment {
  id: string;
  body: string;
  authorUserId: string;
  createdAt: string;
}

export function CommentsPanel({ caseId, currentUserId }: { caseId: string; currentUserId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    const res = await fetch(`/api/cases/${caseId}/comments`);
    if (res.ok) setComments(await res.json());
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/cases/${caseId}/comments`);
      if (cancelled) return;
      if (res.ok) setComments(await res.json());
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function post(): Promise<void> {
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, mentions: [] }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error?.message ?? 'Failed.');
        return;
      }
      setBody('');
      await load();
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string): Promise<void> {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {comments == null ? (
          <li className="text-sm text-muted-foreground">Loading…</li>
        ) : comments.length === 0 ? (
          <li className="text-sm text-muted-foreground">No comments yet.</li>
        ) : (
          comments.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-border bg-background p-3 text-sm"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{c.authorUserId.slice(0, 8)}…</span>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{c.body}</p>
              {c.authorUserId === currentUserId ? (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="mt-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <button
          type="button"
          onClick={post}
          disabled={pending || !body.trim()}
          className="self-end rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Posting…' : 'Post comment'}
        </button>
      </div>
    </div>
  );
}
