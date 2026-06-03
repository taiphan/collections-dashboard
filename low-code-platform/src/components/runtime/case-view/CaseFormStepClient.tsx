'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormDefinition } from '@/lib/validation/form';
import { FormRenderer } from '@/components/runtime/form-renderer/FormRenderer';

interface Props {
  caseId: string;
  definition: FormDefinition;
  initialValues: Record<string, unknown>;
}

export function CaseFormStepClient({ caseId, definition, initialValues }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: Record<string, unknown>): Promise<void> {
    setError(null);
    const res = await fetch(`/api/cases/${caseId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldValues: values }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? 'Failed to submit.');
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error ? (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <FormRenderer
        definition={definition}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Submit & advance"
      />
    </div>
  );
}
