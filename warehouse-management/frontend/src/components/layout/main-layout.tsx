import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Sidebar } from './sidebar';
import { LoginPage } from '@/pages/login';
import { DashboardPage } from '@/pages/dashboard';
import { CatalogPage } from '@/pages/catalog';
import { OperationsPage } from '@/pages/operations';
import { InventoryPage } from '@/pages/inventory';
import { ReportsPage } from '@/pages/reports';
import { AnalyticsPage } from '@/pages/analytics';

const pages: Record<string, () => JSX.Element> = {
  Dashboard: DashboardPage,
  Catalog: CatalogPage,
  Operations: OperationsPage,
  Inventory: InventoryPage,
  Reports: ReportsPage,
  Analytics: AnalyticsPage,
};

export function MainLayout() {
  const { isAuthenticated } = useAuthStore();
  const [activePage, setActivePage] = useState('Dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const PageComponent = pages[activePage] || DashboardPage;

  return (
    <div className="flex h-screen">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-auto p-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}
