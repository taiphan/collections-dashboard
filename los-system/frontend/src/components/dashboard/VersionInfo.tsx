import { useState } from 'react';

interface Feature {
  name: string;
  status: 'live' | 'beta' | 'coming';
  version: string;
  description: string;
}

const PLATFORM_VERSION = '2.0.0';
const BUILD_DATE = '2026-05-31';

const MODULES: Array<{
  category: string;
  features: Feature[];
}> = [
  {
    category: 'Core Origination (v1.0)',
    features: [
      { name: 'Pre-Screening Engine', status: 'live', version: '1.0', description: 'Instant eligibility with bureau + Open Banking data' },
      { name: 'Application Intake', status: 'live', version: '1.0', description: 'Multi-channel, multi-product application wizard' },
      { name: 'Case Management', status: 'live', version: '1.0', description: 'Stage-gate workflow with SLA tracking' },
      { name: 'Decision Engine', status: 'live', version: '1.0', description: 'Rule-based scoring with configurable rule sets' },
      { name: 'Document Management', status: 'live', version: '1.0', description: 'Checklist, upload, verification, completeness' },
      { name: 'Product Catalog', status: 'live', version: '1.0', description: 'Configurable products with amortization' },
      { name: 'Customer Management', status: 'live', version: '1.0', description: '360° view, KYC, risk profiling' },
      { name: 'Compliance Engine', status: 'live', version: '1.0', description: 'AML, sanctions, KYC validation, audit trail' },
      { name: 'Disbursement', status: 'live', version: '1.0', description: 'Automated fund transfer with case closure' },
      { name: 'Reporting & Analytics', status: 'live', version: '1.0', description: 'Pipeline, TAT, officer performance, portfolio' },
    ],
  },
  {
    category: 'Advanced Platform (v1.5)',
    features: [
      { name: 'Visual Strategy Designer', status: 'live', version: '1.5', description: 'No-code drag-and-drop decision strategy builder' },
      { name: 'What-If Simulation', status: 'live', version: '1.5', description: 'Test strategies against historical data' },
      { name: 'Champion-Challenger', status: 'live', version: '1.5', description: 'A/B test decision strategies in production' },
      { name: 'Open Banking Suite', status: 'live', version: '1.5', description: 'Transaction categorization, affordability assessment' },
      { name: 'ESG Scoring', status: 'live', version: '1.5', description: 'Sustainability scoring with pricing adjustment' },
      { name: 'BPMN Workflow Designer', status: 'live', version: '1.5', description: 'Visual process orchestration with BPMN notation' },
      { name: 'Dark/Light Theme', status: 'live', version: '1.5', description: 'System-aware theme with manual override' },
      { name: 'Notification System', status: 'live', version: '1.5', description: 'Real-time alerts for SLA, assignments, decisions' },
    ],
  },
  {
    category: 'Digital Experience (v2.0)',
    features: [
      { name: 'Digital Onboarding', status: 'beta', version: '2.0', description: 'Remote KYC, biometric verification, e-signature' },
      { name: 'GenAI Decision Engine', status: 'beta', version: '2.0', description: 'Natural language strategy creation, agentic AI' },
      { name: 'Anti-Fraud Engine', status: 'beta', version: '2.0', description: 'Deepfake detection, synthetic document defense' },
      { name: 'Customer Management', status: 'coming', version: '2.0', description: 'Early warning, portfolio monitoring, risk mitigation' },
      { name: 'Collection Management', status: 'coming', version: '2.0', description: 'AI-driven recovery, self-cure models, agency mgmt' },
      { name: 'New Customer Acquisition', status: 'coming', version: '2.0', description: 'Lead scoring, pre-approved offers, campaigns' },
      { name: 'Credit Passport', status: 'coming', version: '2.0', description: 'SME credit score visibility and improvement' },
      { name: 'Real-time Credit', status: 'coming', version: '2.0', description: 'Sub-second decisioning for instant approvals' },
    ],
  },
];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  beta: { label: 'Beta', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  coming: { label: 'Coming Soon', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export function VersionInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const liveCount = MODULES.flatMap((m) => m.features).filter((f) => f.status === 'live').length;
  const betaCount = MODULES.flatMap((m) => m.features).filter((f) => f.status === 'beta').length;
  const comingCount = MODULES.flatMap((m) => m.features).filter((f) => f.status === 'coming').length;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-muted hover:bg-accent transition-colors"
        title="Platform version and features"
      >
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        v{PLATFORM_VERSION}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="shrink-0 px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">LOS Platform</h2>
                      <p className="text-sm text-muted-foreground">
                        Digital Experience Platform for Lending
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[12px] font-medium">{liveCount} Live</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[12px] font-medium">{betaCount} Beta</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-[12px] font-medium">{comingCount} Planned</span>
                </div>
                <div className="ml-auto text-[11px] text-muted-foreground">
                  Build: {BUILD_DATE} · Inspired by CRIF Digital
                </div>
              </div>
            </div>

            {/* Feature list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {MODULES.map((module) => (
                <div key={module.category}>
                  <h3 className="text-[13px] font-semibold mb-2">{module.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {module.features.map((feature) => {
                      const badge = STATUS_BADGES[feature.status];
                      return (
                        <div
                          key={feature.name}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            feature.status === 'live'
                              ? 'bg-card hover:bg-accent/50'
                              : feature.status === 'beta'
                                ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-800/30'
                                : 'bg-muted/30 opacity-70'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-medium truncate">{feature.name}</p>
                              <span className={`shrink-0 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-3 border-t bg-muted/30 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                © 2026 LOS Platform · Architecture: Pega Constellation + CRIF Digital
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">v{PLATFORM_VERSION}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
