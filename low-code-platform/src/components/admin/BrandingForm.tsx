'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DesignTokens } from '@/lib/ui/tokens';

interface Props {
  initial: DesignTokens | null;
}

export function BrandingForm({ initial }: Props) {
  const router = useRouter();
  const [primary, setPrimary] = useState(initial?.colors?.primary ?? '');
  const [primaryFg, setPrimaryFg] = useState(initial?.colors?.primaryForeground ?? '');
  const [accent, setAccent] = useState(initial?.colors?.accent ?? '');
  const [radius, setRadius] = useState(initial?.radius?.base ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function clean(v: string): string | undefined {
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  }

  async function save(): Promise<void> {
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const body: DesignTokens = {
        colors: {
          primary: clean(primary),
          primaryForeground: clean(primaryFg),
          accent: clean(accent),
        },
        radius: { base: clean(radius) },
      };
      // Strip empty top-level groups so the payload matches our schema's
      // "all keys optional" expectation.
      if (body.colors && Object.values(body.colors).every((v) => !v)) delete body.colors;
      if (body.radius && Object.values(body.radius).every((v) => !v)) delete body.radius;

      const res = await fetch('/api/admin/tenant-tokens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error?.message ?? 'Save failed.');
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <Field label="Primary color" value={primary} onChange={setPrimary} placeholder="#4f46e5" />
      <Field
        label="Primary foreground"
        value={primaryFg}
        onChange={setPrimaryFg}
        placeholder="#ffffff"
      />
      <Field label="Accent color" value={accent} onChange={setAccent} placeholder="#eef2ff" />
      <Field label="Border radius" value={radius} onChange={setRadius} placeholder="0.625rem" />

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          Saved. Reload pages in this tenant to see updated branding.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save branding'}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
