'use client';

import { useEffect, useState } from 'react';

interface NotificationItem {
  id: string;
  kind: string;
  caseId: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

interface ListResponse {
  rows: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}

const KIND_LABELS: Record<string, string> = {
  assignment: 'Assigned to you',
  reassignment: 'Case reassigned',
  send_back: 'Sent back',
  sla_warning: 'SLA warning',
  sla_breach: 'SLA breached',
  mention: 'Mentioned',
  comment_reply: 'Comment reply',
};

export function NotificationBell(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  // Poll every 30 seconds for unread count.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/notifications?limit=1');
      if (cancelled) return;
      if (res.ok) setData(await res.json());
    })();
    const id = setInterval(() => {
      void (async () => {
        const res = await fetch('/api/notifications?limit=1');
        if (cancelled) return;
        if (res.ok) setData(await res.json());
      })();
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  async function markRead(id: string): Promise<void> {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    if (res.ok) await load();
  }

  function caseHref(caseId: string | null): string | null {
    return caseId ? `/cases/${caseId}` : null;
  }

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((p) => !p);
          if (!open) void load();
        }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className="relative rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default bg-transparent"
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full z-20 mt-2 w-96 rounded-xl border border-border bg-popover p-2 shadow-lg"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-medium text-foreground">Notifications</span>
              {loading ? <span className="text-xs text-muted-foreground">Loading…</span> : null}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {data && data.rows.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                <ul className="flex flex-col">
                  {data?.rows.map((n) => (
                    <li
                      key={n.id}
                      className={
                        'flex flex-col gap-1 rounded-md px-2 py-2 ' +
                        (n.readAt ? '' : 'bg-secondary/40')
                      }
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium uppercase tracking-wide text-muted-foreground">
                          {KIND_LABELS[n.kind] ?? n.kind}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {(n.payload.identifier as string) ??
                          (n.payload.snippet as string) ??
                          'Notification'}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        {caseHref(n.caseId) ? (
                          <a
                            href={caseHref(n.caseId)!}
                            className="text-primary hover:underline"
                          >
                            Open case
                          </a>
                        ) : (
                          <span />
                        )}
                        {!n.readAt ? (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Mark read
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function BellIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
