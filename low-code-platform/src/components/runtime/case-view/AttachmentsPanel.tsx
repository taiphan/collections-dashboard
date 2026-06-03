'use client';

import { useEffect, useRef, useState } from 'react';

interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
  uploaderUserId: string;
}

export function AttachmentsPanel({ caseId, currentUserId }: { caseId: string; currentUserId: string }) {
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load(): Promise<void> {
    const res = await fetch(`/api/cases/${caseId}/attachments`);
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/cases/${caseId}/attachments`);
      if (cancelled) return;
      if (res.ok) setItems(await res.json());
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function upload(file: File): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch(`/api/cases/${caseId}/attachments`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error?.message ?? 'Failed.');
        return;
      }
      if (inputRef.current) inputRef.current.value = '';
      await load();
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string): Promise<void> {
    if (!confirm('Delete this attachment?')) return;
    const res = await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items == null ? (
          <li className="text-sm text-muted-foreground">Loading…</li>
        ) : items.length === 0 ? (
          <li className="text-sm text-muted-foreground">No attachments yet.</li>
        ) : (
          items.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-sm"
            >
              <div className="min-w-0">
                <a
                  href={`/api/attachments/${a.id}`}
                  className="truncate font-medium text-primary hover:underline"
                >
                  {a.filename}
                </a>
                <p className="text-xs text-muted-foreground">
                  {a.contentType} · {Math.ceil(a.byteSize / 1024)} KB ·{' '}
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
              {a.uploaderUserId === currentUserId ? (
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
        <input
          ref={inputRef}
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
          disabled={pending}
          className="block w-full text-sm"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
