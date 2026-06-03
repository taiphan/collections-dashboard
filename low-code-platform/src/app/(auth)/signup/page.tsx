import Link from 'next/link';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signIn } from '@/lib/auth/config';
import * as tenantRepo from '@/lib/db/repositories/tenants';
import * as usersRepo from '@/lib/db/repositories/users';
import { ROLES } from '@/lib/rbac/roles';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120),
  workspaceName: z.string().min(1).max(120),
  workspaceSubdomain: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9](-?[a-z0-9])*$/, 'Lowercase letters, digits and hyphens only.'),
});

export default async function SignupPage() {
  async function signupAction(formData: FormData): Promise<void> {
    'use server';
    const parsed = signupSchema.safeParse({
      email: String(formData.get('email') ?? '').toLowerCase(),
      password: String(formData.get('password') ?? ''),
      displayName: String(formData.get('displayName') ?? ''),
      workspaceName: String(formData.get('workspaceName') ?? ''),
      workspaceSubdomain: String(formData.get('workspaceSubdomain') ?? '').toLowerCase(),
    });
    if (!parsed.success) {
      redirect('/signup?error=validation');
    }

    // Check for existing email + subdomain.
    const existingUser = await usersRepo.getUserByEmail(parsed.data.email);
    if (existingUser) {
      redirect('/signup?error=email_taken');
    }
    const existingTenant = await tenantRepo.getBySubdomain(parsed.data.workspaceSubdomain);
    if (existingTenant) {
      redirect('/signup?error=workspace_taken');
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await usersRepo.createUser({
      email: parsed.data.email,
      passwordHash,
      displayName: parsed.data.displayName,
    });
    const tenant = await tenantRepo.create({
      subdomain: parsed.data.workspaceSubdomain,
      name: parsed.data.workspaceName,
    });
    await usersRepo.addMembership({
      tenantId: tenant.id,
      userId: user.id,
      roles: [ROLES.PLATFORM_ADMIN, ROLES.APP_DESIGNER, ROLES.MANAGER],
    });

    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/worklist',
    });
  }

  return (
    <main className="lcp-grid-bg flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Create your workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Spin up a tenant and become its first admin.
        </p>

        <form action={signupAction} className="mt-5 flex flex-col gap-4">
          <Field name="displayName" label="Your name" autoComplete="name" />
          <Field name="email" label="Email" type="email" autoComplete="email" />
          <Field name="password" label="Password" type="password" autoComplete="new-password" />
          <Field name="workspaceName" label="Workspace name" />
          <Field
            name="workspaceSubdomain"
            label="Workspace subdomain"
            hint="Lowercase letters, digits, hyphens"
          />
          <button
            type="submit"
            className="mt-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Create workspace
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  type = 'text',
  autoComplete,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
