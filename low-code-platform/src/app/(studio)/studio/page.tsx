import Link from 'next/link';
import { AppShell } from '@/components/shared/AppShell';

export const dynamic = 'force-dynamic';

export default function StudioHome() {
  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Studio</h1>
        <p className="text-sm text-muted-foreground">
          Design your application: data models, forms, and case types. Publish each artifact to make
          it available to the runtime.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card href="/studio/data-models" title="Data Models" description="Entities, fields, relationships." />
          <Card href="/studio/forms" title="Forms" description="Drag-and-drop form designer." />
          <Card href="/studio/case-types" title="Case Types" description="Stages, steps, transitions, SLAs." />
          <Card href="/studio/decision-tables" title="Decision Tables" description="Deterministic routing logic." />
          <Card href="/studio/connectors" title="Connectors" description="REST integrations into workflows." />
          <Card href="/studio/releases" title="Releases" description="Package and promote artifacts." />
        </div>
      </div>
    </AppShell>
  );
}

function Card({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-5 transition hover:border-ring/40 hover:shadow-sm"
    >
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-block text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
        Open →
      </span>
    </Link>
  );
}
