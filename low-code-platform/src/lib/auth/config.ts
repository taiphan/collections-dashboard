/**
 * NextAuth v5 configuration.
 *
 * Strategy: JWT sessions with a credentials provider that verifies email +
 * password against the local users table. Tenant memberships are loaded into
 * the JWT on sign-in and refreshed on the `update` event so role changes
 * applied by Platform_Admins (Requirement 2.7) take effect on the next
 * request.
 */

import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import * as usersRepo from '@/lib/db/repositories/users';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
    };
    /** Tenant memberships with the roles the user holds in each tenant. */
    memberships: Array<{ tenantId: string; roles: string[] }>;
  }

  interface JWT {
    sub?: string;
    memberships?: Array<{ tenantId: string; roles: string[] }>;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function loadMembershipsForJwt(userId: string) {
  const list = await usersRepo.listMembershipsForUser(userId);
  return list.map((m) => ({ tenantId: m.tenantId, roles: m.roles }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await usersRepo.getUserByEmail(parsed.data.email);
        if (!user) {
          // Avoid timing differences leaking whether the email exists
          // (Requirement 2.2): perform a dummy bcrypt compare anyway.
          await bcrypt.compare(parsed.data.password, '$2a$10$invalidsaltthatisinvalid');
          return null;
        }
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const t = token as typeof token & {
        memberships?: Array<{ tenantId: string; roles: string[] }>;
      };
      if (user) {
        token.sub = user.id ?? token.sub;
        if (token.sub) {
          t.memberships = await loadMembershipsForJwt(token.sub);
        }
      } else if (trigger === 'update' && token.sub) {
        t.memberships = await loadMembershipsForJwt(token.sub);
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as typeof token & {
        memberships?: Array<{ tenantId: string; roles: string[] }>;
      };
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      session.memberships = t.memberships ?? [];
      return session;
    },
  },
});
