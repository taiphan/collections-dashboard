import { useState } from 'react';

interface ModelMetrics {
  modelId: string;
  name: string;
  type: 'credit_score' | 'fraud' | 'collection' | 'churn';
  version: string;
  accuracy: number;
  auc: number;
  gini: number;
  ks: number;
  lastTrained: string;
  status: 'active' | 'monitoring' | 'retired';
  driftDetected: boolean;
}

interface GovernanceRecord {
  action: string;
  performedBy: string;
  timestamp: string;
  notes: string;
}

const MOCK_MODELS: ModelMetrics[] = [
  {
    modelId: 'model-credit-v3',
    name: 'Credit Scorecard v3',
    type: 'credit_score',
    version: '3.2.1',
    accuracy: 0.847,
    auc: 0.891,
    gini: 0.782,
    ks: 0.634,
    lastTrained: '2024-08-15',
    status: 'active',
    driftDetected: false,
  },
  {
    modelId: 'model-fraud-v2',
    name: 'Fraud Detection Engine',
    type: 'fraud',
    version: '2.1.0',
    accuracy: 0.923,
    auc: 0.956,
    gini: 0.912,
    ks: 0.789,
    lastTrained: '2024-09-01',
    status: 'active',
    driftDetected: false,
  },
  {
    modelId: 'model-collection-v1',
    name: 'Collection Propensity',
    type: 'collection',
    version: '1.4.2',
    accuracy: 0.781,
    auc: 0.823,
    gini: 0.646,
    ks: 0.521,
    lastTrained: '2024-07-20',
    status: 'monitoring',
    driftDetected: true,
  },
  {
    modelId: 'model-churn-v1',
    name: 'Customer Churn Predictor',
    type: 'churn',
    version: '1.2.0',
    accuracy: 0.812,
    auc: 0.867,
    gini: 0.734,
    ks: 0.589,
    lastTrained: '2024-06-10',
    status: 'active',
    driftDetected: false,
  },
  {
    modelId: 'model-credit-v2',
    name: 'Credit Scorecard v2 (Legacy)',
    type: 'credit_score',
    version: '2.8.0',
    accuracy: 0.798,
    auc: 0.842,
    gini: 0.684,
    ks: 0.567,
    lastTrained: '2023-12-01',
    status: 'retired',
    driftDetected: true,
  },
];

const MOCK_FEATURES = [
  { name: 'payment_history', importance: 0.92, direction: 'positive' },
  { name: 'credit_utilization', importance: 0.85, direction: 'negative' },
  { name: 'credit_age', importance: 0.72, direction: 'positive' },
  { name: 'debt_to_income', importance: 0.68, direction: 'negative' },
  { name: 'num_accounts', importance: 0.54, direction: 'positive' },
  { name: 'recent_inquiries', importance: 0.41, direction: 'negative' },
  { name: 'employment_stability', importance: 0.38, direction: 'positive' },
  { name: 'income_level', importance: 0.32, direction: 'positive' },
];

const MOCK_GOVERNANCE: GovernanceRecord[] = [
  { action: 'created', performedBy: 'data-science-team', timestamp: '2024-03-15', notes: 'Initial model architecture defined' },
  { action: 'trained', performedBy: 'ml-pipeline', timestamp: '2024-05-20', notes: 'Training on 24-month dataset (500K records)' },
  { action: 'validated', performedBy: 'model-validation-team', timestamp: '2024-06-01', notes: 'Validation passed — meets all thresholds' },
  { action: 'approved', performedBy: 'risk-committee', timestamp: '2024-06-15', notes: 'Approved for production deployment' },
  { action: 'deployed', performedBy: 'mlops-team', timestamp: '2024-07-01', notes: 'Deployed to production environment' },
];

export function ModelRegistry() {
  const [models] = useState<ModelMetrics[]>(MOCK_MODELS);
  const [selectedModel, setSelectedModel] = useState<ModelMetrics | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const handleCompareToggle = (modelId: string) => {
    setCompareSelection((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : prev.length < 2
          ? [...prev, modelId]
          : prev,
    );
  };

  const compareModels = compareSelection.length === 2
    ? models.filter((m) => compareSelection.includes(m.modelId))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ML Model Registry</h2>
          <p className="text-sm text-muted-foreground">
            {models.length} models registered, {models.filter((m) => m.status === 'active').length} active
          </p>
        </div>
        <button
          onClick={() => { setCompareMode(!compareMode); setCompareSelection([]); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            compareMode
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          {compareMode ? 'Exit Compare' : 'Compare Models'}
        </button>
      </div>

      {/* Compare View */}
      {compareMode && compareModels.length === 2 && (
        <CompareView modelA={compareModels[0]} modelB={compareModels[1]} />
      )}

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <ModelCard
            key={model.modelId}
            model={model}
            isSelected={selectedModel?.modelId === model.modelId}
            compareMode={compareMode}
            isCompareSelected={compareSelection.includes(model.modelId)}
            onSelect={() => setSelectedModel(model)}
            onCompareToggle={() => handleCompareToggle(model.modelId)}
          />
        ))}
      </div>

      {/* Model Detail Panel */}
      {selectedModel && !compareMode && (
        <ModelDetailPanel model={selectedModel} onClose={() => setSelectedModel(null)} />
      )}
    </div>
  );
}

function ModelCard({
  model,
  isSelected,
  compareMode,
  isCompareSelected,
  onSelect,
  onCompareToggle,
}: {
  model: ModelMetrics;
  isSelected: boolean;
  compareMode: boolean;
  isCompareSelected: boolean;
  onSelect: () => void;
  onCompareToggle: () => void;
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    monitoring: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    retired: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const typeIcons = {
    credit_score: <CreditCardIcon className="w-5 h-5" />,
    fraud: <ShieldAlertIcon className="w-5 h-5" />,
    collection: <WalletIcon className="w-5 h-5" />,
    churn: <UserMinusIcon className="w-5 h-5" />,
  };

  return (
    <div
      className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${isCompareSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={compareMode ? onCompareToggle : onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {typeIcons[model.type]}
          </div>
          <div>
            <h4 className="text-sm font-semibold">{model.name}</h4>
            <p className="text-[10px] text-muted-foreground">v{model.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {model.driftDetected && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Drift
            </span>
          )}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[model.status]}`}>
            {model.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricItem label="Accuracy" value={(model.accuracy * 100).toFixed(1) + '%'} />
        <MetricItem label="AUC" value={model.auc.toFixed(3)} />
        <MetricItem label="Gini" value={model.gini.toFixed(3)} />
        <MetricItem label="KS" value={model.ks.toFixed(3)} />
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Trained: {new Date(model.lastTrained).toLocaleDateString()}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize">
          {model.type.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function ModelDetailPanel({ model, onClose }: { model: ModelMetrics; onClose: () => void }) {
  return (
    <div className="bg-card border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold">{model.name}</h3>
          <p className="text-xs text-muted-foreground">
            Version {model.version} — {model.type.replace(/_/g, ' ')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Feature Importance</h4>
          <div className="space-y-2">
            {MOCK_FEATURES.map((feature) => (
              <div key={feature.name} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-32 truncate">
                  {feature.name.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      feature.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${feature.importance * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-10 text-right">
                  {(feature.importance * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Governance Timeline */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Governance Timeline</h4>
          <div className="space-y-3">
            {MOCK_GOVERNANCE.map((record, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {i < MOCK_GOVERNANCE.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium capitalize">{record.action}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{record.notes}</p>
                  <p className="text-[10px] text-muted-foreground/70">by {record.performedBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareView({ modelA, modelB }: { modelA: ModelMetrics; modelB: ModelMetrics }) {
  const metrics = [
    { label: 'Accuracy', a: modelA.accuracy, b: modelB.accuracy },
    { label: 'AUC', a: modelA.auc, b: modelB.auc },
    { label: 'Gini', a: modelA.gini, b: modelB.gini },
    { label: 'KS', a: modelA.ks, b: modelB.ks },
  ];

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="text-sm font-semibold mb-4">Model Comparison</h3>
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div>
          <p className="text-sm font-medium">{modelA.name}</p>
          <p className="text-xs text-muted-foreground">v{modelA.version}</p>
        </div>
        <div className="text-xs text-muted-foreground self-center">vs</div>
        <div>
          <p className="text-sm font-medium">{modelB.name}</p>
          <p className="text-xs text-muted-foreground">v{modelB.version}</p>
        </div>
      </div>
      <div className="space-y-3">
        {metrics.map((m) => {
          const winner = m.a >= m.b ? 'a' : 'b';
          return (
            <div key={m.label} className="grid grid-cols-3 gap-4 items-center">
              <div className={`text-right text-sm font-medium ${winner === 'a' ? 'text-green-600' : ''}`}>
                {(m.a * 100).toFixed(1)}%
              </div>
              <div className="text-center text-xs text-muted-foreground">{m.label}</div>
              <div className={`text-left text-sm font-medium ${winner === 'b' ? 'text-green-600' : ''}`}>
                {(m.b * 100).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Icons
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function ShieldAlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function UserMinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM18 11h4" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
