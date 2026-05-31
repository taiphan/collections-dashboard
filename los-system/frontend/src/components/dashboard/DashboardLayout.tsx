import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Sidebar } from './Sidebar';
import { DashboardHome } from './DashboardHome';
import { CaseList } from '@/components/case/CaseList';
import { CaseDetail } from '@/components/case-detail/CaseDetail';
import { ApplicationList } from '@/components/application/ApplicationList';
import { ApplicationWizard } from '@/components/application/ApplicationWizard';
import { ProductCatalog } from '@/components/product/ProductCatalog';
import { LoanCalculator } from '@/components/product/LoanCalculator';
import { ReportingDashboard } from '@/components/reporting/ReportingDashboard';
import { PreScreeningForm } from '@/components/pre-screening/PreScreeningForm';
import { StrategyDesigner } from '@/components/decision-designer/StrategyDesigner';
import { OnboardingWizard } from '@/components/digital-onboarding/OnboardingWizard';
import { PortfolioDashboard } from '@/components/customer-management/PortfolioDashboard';
import { CollectionDashboard } from '@/components/collection/CollectionDashboard';
import { ModelRegistry } from '@/components/advanced-analytics/ModelRegistry';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { VersionInfo } from './VersionInfo';

type View =
  | 'dashboard'
  | 'cases'
  | 'case-detail'
  | 'applications'
  | 'new-application'
  | 'customers'
  | 'products'
  | 'reports'
  | 'pre-screening'
  | 'strategies'
  | 'onboarding'
  | 'portfolio'
  | 'collection'
  | 'analytics';

export function DashboardLayout() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { user, logout } = useAuthStore();

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
    setSelectedCaseId(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome />;
      case 'cases':
        return <CaseList onSelectCase={(id) => { setSelectedCaseId(id); setCurrentView('case-detail'); }} />;
      case 'case-detail':
        return selectedCaseId ? (
          <CaseDetail
            caseId={selectedCaseId}
            onBack={() => setCurrentView('cases')}
          />
        ) : null;
      case 'applications':
        return <ApplicationList />;
      case 'new-application':
        return (
          <ApplicationWizard
            onComplete={() => setCurrentView('applications')}
            onCancel={() => setCurrentView('applications')}
          />
        );
      case 'customers':
        return (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Customer Management</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                360° customer view with KYC verification, risk profiling, and relationship management.
              </p>
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="space-y-6">
            <ProductCatalog />
            <LoanCalculator />
          </div>
        );
      case 'reports':
        return <ReportingDashboard />;
      case 'pre-screening':
        return <PreScreeningForm />;
      case 'strategies':
        return <StrategyDesigner />;
      case 'onboarding':
        return <OnboardingWizard />;
      case 'portfolio':
        return <PortfolioDashboard />;
      case 'collection':
        return <CollectionDashboard />;
      case 'analytics':
        return <ModelRegistry />;
      default:
        return <DashboardHome />;
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'cases': return 'Case Management';
      case 'case-detail': return 'Case Details';
      case 'applications': return 'Applications';
      case 'new-application': return 'New Application';
      case 'customers': return 'Customers';
      case 'products': return 'Product Catalog';
      case 'reports': return 'Reports & Analytics';
      case 'pre-screening': return 'Pre-Screening';
      case 'strategies': return 'Decision Strategies';
      case 'onboarding': return 'Digital Onboarding';
      case 'portfolio': return 'Portfolio Management';
      case 'collection': return 'Collection & Recovery';
      case 'analytics': return 'ML Model Registry';
      default: return 'Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (currentView) {
      case 'dashboard': return 'Overview of your loan origination pipeline';
      case 'cases': return 'Manage active loan processing cases';
      case 'applications': return 'Track loan applications';
      case 'products': return 'Configure loan products and pricing';
      case 'reports': return 'Analytics and performance metrics';
      case 'pre-screening': return 'Instant eligibility assessment';
      case 'strategies': return 'Visual decision strategy designer';
      case 'onboarding': return 'Digital customer onboarding with identity verification';
      case 'portfolio': return 'Customer health monitoring and early warning system';
      case 'collection': return 'Overdue account management and recovery tracking';
      case 'analytics': return 'Model governance, drift detection, and explainability';
      default: return '';
    }
  };

  return (
    <div className="flex h-screen bg-background theme-transition">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onLogout={logout}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 bg-[hsl(var(--header-bg))] border-b px-6 flex items-center justify-between theme-transition">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">{getPageTitle()}</h1>
            {getPageDescription() && (
              <p className="text-[12px] text-muted-foreground">{getPageDescription()}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <VersionInfo />
            <NotificationBell />

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="hidden md:block">
                <p className="text-[13px] font-medium leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight capitalize">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
