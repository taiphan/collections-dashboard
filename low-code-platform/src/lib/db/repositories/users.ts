/**
 * Users + memberships repo.
 *
 * Users themselves are global; memberships are tenant-scoped.
 */

import { and, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { memberships, users } from '@/lib/db/schema';

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
}

export interface MembershipRow {
  id: string;
  tenantId: string;
  userId: string;
  roles: string[];
  emailPrefs: { assignments: boolean; sla: boolean; mentions: boolean };
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const rows = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  displayName: string;
}): Promise<UserRow> {
  const rows = await getDb()
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName,
    })
    .returning();
  return rows[0]!;
}

export async function listMembershipsForUser(userId: string): Promise<MembershipRow[]> {
  const rows = await getDb()
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));
  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    userId: r.userId,
    roles: r.roles,
    emailPrefs: r.emailPrefs,
  }));
}

export async function getMembership(
  tenantId: string,
  userId: string,
): Promise<MembershipRow | null> {
  const rows = await getDb()
    .select()
    .from(memberships)
    .where(and(eq(memberships.tenantId, tenantId), eq(memberships.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    roles: row.roles,
    emailPrefs: row.emailPrefs,
  };
}

export async function listMembersOfTenant(tenantId: string): Promise<MembershipRow[]> {
  const rows = await getDb()
    .select()
    .from(memberships)
    .where(eq(memberships.tenantId, tenantId));
  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    userId: r.userId,
    roles: r.roles,
    emailPrefs: r.emailPrefs,
  }));
}

export async function listMembersWithRole(
  tenantId: string,
  role: string,
): Promise<MembershipRow[]> {
  // Drizzle doesn't expose a typed `ANY` operator for text[] yet; use raw SQL.
  const all = await listMembersOfTenant(tenantId);
  return all.filter((m) => m.roles.includes(role));
}

export async function addMembership(input: {
  tenantId: string;
  userId: string;
  roles: string[];
}): Promise<MembershipRow> {
  const rows = await getDb()
    .insert(memberships)
    .values({
      tenantId: input.tenantId,
      userId: input.userId,
      roles: input.roles,
    })
    .returning();
  const row = rows[0]!;
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    roles: row.roles,
    emailPrefs: row.emailPrefs,
  };
}

export async function updateMembershipRoles(
  tenantId: string,
  userId: string,
  roles: string[],
): Promise<void> {
  await getDb()
    .update(memberships)
    .set({ roles })
    .where(and(eq(memberships.tenantId, tenantId), eq(memberships.userId, userId)));
}

export async function removeMembership(tenantId: string, userId: string): Promise<void> {
  await getDb()
    .delete(memberships)
    .where(and(eq(memberships.tenantId, tenantId), eq(memberships.userId, userId)));
}
