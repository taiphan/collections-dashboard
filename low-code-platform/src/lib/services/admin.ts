/**
 * Admin service. Implements Requirement 2.6, 2.7, 2.8 + tenant CRUD for
 * Platform_Admins.
 */

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import * as tenantRepo from '@/lib/db/repositories/tenants';
import * as usersRepo from '@/lib/db/repositories/users';
import { ROLES, requireRole } from '@/lib/rbac/roles';
import { ConflictError, ValidationFailedError } from '@/lib/auth/errors';
import * as audit from '@/lib/services/audit';
import type { TenantContext } from '@/lib/tenancy/types';

const subdomainSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9](-?[a-z0-9])*$/);

export async function listTenantsAsAdmin(ctx: TenantContext) {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  return tenantRepo.listAll();
}

export async function createTenant(
  ctx: TenantContext,
  input: { subdomain: string; name: string },
) {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  const sub = subdomainSchema.safeParse(input.subdomain.toLowerCase());
  if (!sub.success) {
    throw new ValidationFailedError({ formErrors: ['Invalid subdomain.'] });
  }
  const existing = await tenantRepo.getBySubdomain(sub.data);
  if (existing) throw new ConflictError('Subdomain already taken.');
  const t = await tenantRepo.create({ subdomain: sub.data, name: input.name });
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'tenant',
    artifactId: t.id,
    action: 'create',
    metadata: { subdomain: t.subdomain, name: t.name },
  });
  return t;
}

export async function listMembersAsAdmin(ctx: TenantContext) {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  return usersRepo.listMembersOfTenant(ctx.tenantId);
}

export async function inviteUser(
  ctx: TenantContext,
  input: { email: string; password: string; displayName: string; roles: string[] },
) {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  const email = input.email.toLowerCase();
  let user = await usersRepo.getUserByEmail(email);
  if (!user) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    user = await usersRepo.createUser({
      email,
      passwordHash,
      displayName: input.displayName,
    });
  }
  const existing = await usersRepo.getMembership(ctx.tenantId, user.id);
  if (existing) throw new ConflictError('User is already a member of this tenant.');
  const m = await usersRepo.addMembership({
    tenantId: ctx.tenantId,
    userId: user.id,
    roles: input.roles,
  });
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'membership',
    artifactId: m.id,
    action: 'create',
    metadata: { userEmail: email, roles: input.roles },
  });
  return m;
}

export async function updateRoles(
  ctx: TenantContext,
  userId: string,
  roles: string[],
) {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  await usersRepo.updateMembershipRoles(ctx.tenantId, userId, roles);
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'membership',
    artifactId: userId,
    action: 'update',
    metadata: { roles },
  });
}

export async function revokeMembership(ctx: TenantContext, userId: string) {
  requireRole(ctx, ROLES.PLATFORM_ADMIN);
  await usersRepo.removeMembership(ctx.tenantId, userId);
  await audit.record(ctx, {
    actorUserId: ctx.userId,
    artifactType: 'membership',
    artifactId: userId,
    action: 'delete',
  });
}
