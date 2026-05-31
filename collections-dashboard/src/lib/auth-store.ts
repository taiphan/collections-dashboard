import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'collector' | 'viewer';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

// Demo users for the collection platform
const DEMO_USERS: { username: string; password: string; user: User }[] = [
  {
    username: 'admin',
    password: 'admin123',
    user: {
      id: 'usr-001',
      username: 'admin',
      name: 'System Admin',
      role: 'admin',
    },
  },
  {
    username: 'manager',
    password: 'manager123',
    user: {
      id: 'usr-002',
      username: 'manager',
      name: 'Pham Thi Mai',
      role: 'manager',
    },
  },
  {
    username: 'collector',
    password: 'collector123',
    user: {
      id: 'usr-003',
      username: 'collector',
      name: 'Nguyen Minh Tuan',
      role: 'collector',
    },
  },
  {
    username: 'viewer',
    password: 'viewer123',
    user: {
      id: 'usr-004',
      username: 'viewer',
      name: 'Le Van Duc',
      role: 'viewer',
    },
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (username, password) => {
        const match = DEMO_USERS.find(
          (u) => u.username === username && u.password === password
        );

        if (!match) {
          return { success: false, error: 'Invalid username or password' };
        }

        set({ user: match.user, isAuthenticated: true });
        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'collections-auth-storage',
    }
  )
);
