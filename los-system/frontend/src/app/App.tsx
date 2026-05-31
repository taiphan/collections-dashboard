import { useAuthStore } from '@/stores/auth.store';
import { LoginPage } from '@/components/auth/LoginPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <DashboardLayout />;
}
