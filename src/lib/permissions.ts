import type { User } from './auth-store';

export type Permission =
  | 'cases.view'
  | 'cases.edit'
  | 'cases.assign'
  | 'cases.delete'
  | 'strategies.view'
  | 'strategies.create'
  | 'strategies.edit'
  | 'analytics.view'
  | 'analytics.export'
  | 'agents.view'
  | 'agents.manage'
  | 'scoring.view'
  | 'scoring.deploy'
  | 'compliance.view'
  | 'compliance.audit'
  | 'settings.view'
  | 'settings.edit'
  | 'users.manage';

type Role = User['role'];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'cases.view', 'cases.edit', 'cases.assign', 'cases.delete',
    'strategies.view', 'strategies.create', 'strategies.edit',
    'analytics.view', 'analytics.export',
    'agents.view', 'agents.manage',
    'scoring.view', 'scoring.deploy',
    'compliance.view', 'compliance.audit',
    'settings.view', 'settings.edit',
    'users.manage',
  ],
  manager: [
    'cases.view', 'cases.edit', 'cases.assign',
    'strategies.view', 'strategies.create', 'strategies.edit',
    'analytics.view', 'analytics.export',
    'agents.view', 'agents.manage',
    'scoring.view',
    'compliance.view',
    'settings.view',
  ],
  collector: [
    'cases.view', 'cases.edit',
    'strategies.view',
    'analytics.view',
  ],
  viewer: [
    'cases.view',
    'strategies.view',
    'analytics.view', 'analytics.export',
    'agents.view',
    'scoring.view',
    'compliance.view', 'compliance.audit',
    'settings.view',
  ],
};

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if a role can access a route. Routes not in this map are accessible to all authenticated users.
 */
const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/agents': 'agents.view',
  '/scoring': 'scoring.view',
  '/compliance': 'compliance.view',
  '/settings': 'settings.view',
  '/strategies': 'strategies.view',
};

export function canAccessRoute(role: Role | undefined, route: string): boolean {
  const required = ROUTE_PERMISSIONS[route];
  if (!required) return true;
  return hasPermission(role, required);
}
