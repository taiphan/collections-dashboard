'use client';

import { useAuthStore } from '@/lib/auth-store';
import { LoginForm } from '@/components/auth/login-form';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { RouteGuard } from './route-guard';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <RouteGuard>{children}</RouteGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
