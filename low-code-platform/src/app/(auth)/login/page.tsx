import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth/config';

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const error = sp.error;
  const next = sp.next ?? '/worklist';

  async function loginAction(formData: FormData): Promise<void> {
    'use server';
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const nextParam = String(formData.get('next') ?? '/worklist');
    try {
      await signIn('credentials', { email, password, redirectTo: nextParam });
    } catch (err) {
      // NextAuth throws a redirect "error" on success — re-throw it.
      if (err && typeof err === 'object' && 'digest' in err) throw err;
      redirect(`/login?error=invalid&next=${encodeURIComponent(nextParam)}`);
    }
  }

  return (
    <main className="lcp-grid-bg flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Sign in to continue.
        </p>

        <form action={loginAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Invalid email or password.
            </p>
          ) : null}

          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
