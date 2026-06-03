/**
 * Role constants and helpers for role-based access control.
 *
 * Roles live on the `memberships.roles` array column. A user may hold
 * multiple roles within a single tenant.
 */

import { ForbiddenError } from '@/lib/auth/errors';
import type { TenantContext } from '@/lib/tenancy/types';

export const ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  APP_DESIGNER: 'app_designer',
  CASE_WORKER: 'case_worker',
  MANAGER: 'manager',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: readonly Role[] = Object.values(ROLES);

export function hasRole(ctx: Pick<TenantContext, 'roles'>, role: Role): boolean {
  return ctx.roles.includes(role);
}

export function hasAnyRole(ctx: Pick<TenantContext, 'roles'>, roles: readonly Role[]): boolean {
  return roles.some((r) => ctx.roles.includes(r));
}

export function requireRole(ctx: Pick<TenantContext, 'roles'>, role: Role): void {
  if (!hasRole(ctx, role)) {
    throw new ForbiddenError(`This action requires the "${role}" role.`);
  }
}

export function requireAnyRole(
  ctx: Pick<TenantContext, 'roles'>,
  roles: readonly Role[],
): void {
  if (!hasAnyRole(ctx, roles)) {
    throw new ForbiddenError(
      `This action requires one of: ${roles.join(', ')}.`,
    );
  }
}
