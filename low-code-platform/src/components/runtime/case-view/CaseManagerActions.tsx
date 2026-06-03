'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SendBackOption {
  id: string;
  label: string;
}

interface Props {
  caseId: string;
  sendBacks: SendBackOption[];
  canManage: boolean;
}

export function CaseManagerActions({ caseId, sendBacks, canManage }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<'sendback' | 'reassign' | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  async function callApi(path: string, body: unknown): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error?.message ?? 'Failed.');
        return;
      }
      setOpen(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {sendBacks.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(open === 'sendback' ? null : 'sendback')}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            Send back…
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(open === 'reassign' ? null : 'reassign')}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
        >
          Reassign…
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {open === 'sendback' ? (
        <SendBackForm
          options={sendBacks}
          pending={pending}
          onSubmit={(transitionId, reason) =>
            callApi('send-back', { transitionId, reason })
          }
          onCancel={() => setOpen(null)}
        />
      ) : null}

      {open === 'reassign' ? (
        <ReassignForm
          pending={pending}
          onSubmit={(newAssigneeUserId) => callApi('reassign', { newAssigneeUserId })}
          onCancel={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

function SendBackForm({
  options,
  pending,
  onSubmit,
  onCancel,
}: {
  options: SendBackOption[];
  pending: boolean;
  onSubmit: (transitionId: string, reason: string) => void;
  onCancel: () => void;
}) {
  const [transitionId, setTransitionId] = useState(options[0]?.id ?? '');
  const [reason, setReason] = useState('');
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-sm font-medium text-foreground">Send back to a previous step</p>
      <select
        value={transitionId}
        onChange={(e) => setTransitionId(e.target.value)}
        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        rows={2}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending || !transitionId}
          onClick={() => onSubmit(transitionId, reason)}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Sending back…' : 'Send back'}
        </button>
      </div>
    </div>
  );
}

function ReassignForm({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: (newAssigneeUserId: string) => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = useState('');
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-sm font-medium text-foreground">Reassign case</p>
      <input
        type="text"
        placeholder="Assignee user id"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Paste a user id from the Admin page. A user-picker UI ships in a follow-up.
      </p>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending || !userId}
          onClick={() => onSubmit(userId)}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Reassigning…' : 'Reassign'}
        </button>
      </div>
    </div>
  );
}
