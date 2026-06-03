'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  endpoint: string;
  version: number;
  alreadyPublished?: boolean;
}

/**
 * Generic publish control used by entity / form / case-type pages. POSTs
 * { version } to the artifact's publish endpoint.
 */
export function PublishButton({ endpoint, version, alreadyPublished = false }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error?.message ?? 'Publish failed.');
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={publish}
        disabled={pending || alreadyPublished}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {alreadyPublished ? `v${version} published` : pending ? 'Publishing…' : `Publish v${version}`}
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
