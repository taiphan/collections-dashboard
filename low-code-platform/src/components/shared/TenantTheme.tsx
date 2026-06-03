import type { ReactNode } from 'react';
import { tokensToCssVariables, type DesignTokens } from '@/lib/ui/tokens';
import * as tenantRepo from '@/lib/db/repositories/tenants';

interface TenantThemeProps {
  tenantId: string;
  children: ReactNode;
}

/**
 * Server component: loads the active tenant's tokens and applies them as CSS
 * variables on a wrapper element. Per V2.B Acceptance 4, this happens in
 * server-rendered HTML so first paint already reflects the tenant brand.
 */
export async function TenantTheme({ tenantId, children }: TenantThemeProps) {
  const tenant = await tenantRepo.getById(tenantId);
  const css = tokensToCssVariables(tenant?.designTokens as DesignTokens | null | undefined);
  if (Object.keys(css).length === 0) return <>{children}</>;
  return <div style={css}>{children}</div>;
}
