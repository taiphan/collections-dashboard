'use client';

import { useAuthStore } from '@/lib/auth-store';
import { LoginForm } from './login-form';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
