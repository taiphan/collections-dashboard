import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import { ROLES, hasRole } from '@/lib/rbac/roles';
import { ForbiddenError } from '@/lib/auth/errors';
import * as tenantRepo from '@/lib/db/repositories/tenants';
import { BrandingForm } from '@/components/admin/BrandingForm';
import type { DesignTokens } from '@/lib/ui/tokens';

export const dynamic = 'force-dynamic';

export default async function BrandingPage() {
  const ctx = await requireTenantContext();
  if (!hasRole(ctx, ROLES.PLATFORM_ADMIN)) throw new ForbiddenError();

  const tenant = await tenantRepo.getById(ctx.tenantId);
  const tokens = (tenant?.designTokens as DesignTokens | null | undefined) ?? null;

  return (
    <AppShell active="admin">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Branding</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Override design tokens for this workspace. Empty fields fall back to the platform defaults.
          </p>
        </div>
        <BrandingForm initial={tokens} />
      </div>
    </AppShell>
  );
}
