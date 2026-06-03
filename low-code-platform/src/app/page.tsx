import Link from 'next/link';
import type { Route } from 'next';

export default function HomePage() {
  return (
    <main className="lcp-grid-bg flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          MVP scaffold
        </span>
        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Low-Code Platform
        </h1>
        <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          Build operational apps with visual modeling. Case management, forms,
          data models, and SLAs — all multi-tenant from day one.
        </p>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
          <FeatureCard
            title="Studio"
            description="Design entities, forms, and case types in a polished drag-and-drop studio."
            href={'/studio' as Route}
          />
          <FeatureCard
            title="Worklist"
            description="Work cases through stages with SLA-aware prioritization."
            href={'/worklist' as Route}
          />
        </div>

        <p className="mt-12 text-xs text-muted-foreground">
          Spec at <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">.kiro/specs/low-code-platform/</code>
        </p>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: Route;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-ring/40 hover:shadow-sm focus-visible:border-ring"
    >
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="mt-1 text-sm text-muted-foreground">{description}</span>
      <span className="mt-3 inline-flex items-center text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        Open →
      </span>
    </Link>
  );
}
