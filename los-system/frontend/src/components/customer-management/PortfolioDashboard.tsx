import { useState } from 'react';

interface PortfolioMetrics {
  totalCustomers: number;
  totalExposure: number;
  atRiskCount: number;
  healthDistribution: { healthy: number; watch: number; concern: number; critical: number };
  avgHealthScore: number;
}

interface EarlyWarningAlert {
  id: string;
  customerId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  triggeredAt: string;
  resolved: boolean;
  recommendedAction: string;
}

const MOCK_METRICS: PortfolioMetrics = {
  totalCustomers: 1247,
  totalExposure: 56200000,
  atRiskCount: 89,
  healthDistribution: { healthy: 686, watch: 312, concern: 162, critical: 87 },
  avgHealthScore: 72.4,
};

const MOCK_ALERTS: EarlyWarningAlert[] = [
  {
    id: '1',
    customerId: 'cust-001',
    type: 'payment_delay',
    severity: 'high',
    description: 'Payment overdue by 15 days on loan #LN-2024-001',
    triggeredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    resolved: false,
    recommendedAction: 'Contact customer via phone, offer payment plan',
  },
  {
    id: '2',
    customerId: 'cust-002',
    type: 'income_drop',
    severity: 'medium',
    description: 'Monthly income decreased by 25% based on bank statements',
    triggeredAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    resolved: false,
    recommendedAction: 'Schedule financial review meeting',
  },
  {
    id: '3',
    customerId: 'cust-003',
    type: 'high_utilization',
    severity: 'low',
    description: 'Credit utilization reached 85% across all facilities',
    triggeredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    resolved: false,
    recommendedAction: 'Monitor for 30 days, consider limit review',
  },
  {
    id: '4',
    customerId: 'cust-004',
    type: 'adverse_event',
    severity: 'critical',
    description: 'Bankruptcy filing detected in public records',
    triggeredAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
    resolved: false,
    recommendedAction: 'Immediate escalation to risk committee',
  },
  {
    id: '5',
    customerId: 'cust-005',
    type: 'behavioral_change',
    severity: 'medium',
    description: 'Unusual transaction pattern — multiple cash advances',
    triggeredAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    resolved: true,
    recommendedAction: 'Review transaction history, update risk profile',
  },
];

export function PortfolioDashboard() {
  const [metrics] = useState<PortfolioMetrics>(MOCK_METRICS);
  const [alerts] = useState<EarlyWarningAlert[]>(MOCK_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredAlerts = filterSeverity === 'all'
    ? alerts
    : alerts.filter((a) => a.severity === filterSeverity);

  const totalDistribution =
    metrics.healthDistribution.healthy +
    metrics.healthDistribution.watch +
    metrics.healthDistribution.concern +
    metrics.healthDistribution.critical;

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Customers"
          value={metrics.totalCustomers.toLocaleString()}
          icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <MetricCard
          label="Total Exposure"
          value={`$${(metrics.totalExposure / 1000000).toFixed(1)}M`}
          icon={<DollarIcon className="w-5 h-5 text-green-600" />}
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <MetricCard
          label="At Risk"
          value={metrics.atRiskCount.toString()}
          icon={<AlertTriangleIcon className="w-5 h-5 text-amber-600" />}
          bgColor="bg-amber-50 dark:bg-amber-900/20"
          subtitle={`${((metrics.atRiskCount / metrics.totalCustomers) * 100).toFixed(1)}% of portfolio`}
        />
        <MetricCard
          label="Avg Health Score"
          value={metrics.avgHealthScore.toString()}
          icon={<HeartIcon className="w-5 h-5 text-rose-600" />}
          bgColor="bg-rose-50 dark:bg-rose-900/20"
          subtitle={metrics.avgHealthScore >= 70 ? 'Good' : 'Needs attention'}
        />
      </div>

      {/* Health Distribution */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Portfolio Health Distribution</h3>
        <div className="flex items-center gap-1 h-8 rounded-lg overflow-hidden mb-4">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(metrics.healthDistribution.healthy / totalDistribution) * 100}%` }}
          />
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${(metrics.healthDistribution.watch / totalDistribution) * 100}%` }}
          />
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${(metrics.healthDistribution.concern / totalDistribution) * 100}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${(metrics.healthDistribution.critical / totalDistribution) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <DistributionLabel
            color="bg-green-500"
            label="Healthy"
            count={metrics.healthDistribution.healthy}
            percentage={((metrics.healthDistribution.healthy / totalDistribution) * 100).toFixed(1)}
          />
          <DistributionLabel
            color="bg-amber-400"
            label="Watch"
            count={metrics.healthDistribution.watch}
            percentage={((metrics.healthDistribution.watch / totalDistribution) * 100).toFixed(1)}
          />
          <DistributionLabel
            color="bg-orange-500"
            label="Concern"
            count={metrics.healthDistribution.concern}
            percentage={((metrics.healthDistribution.concern / totalDistribution) * 100).toFixed(1)}
          />
          <DistributionLabel
            color="bg-red-500"
            label="Critical"
            count={metrics.healthDistribution.critical}
            percentage={((metrics.healthDistribution.critical / totalDistribution) * 100).toFixed(1)}
          />
        </div>
      </div>

      {/* Early Warning Alerts */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Early Warning Alerts</h3>
          <div className="flex items-center gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterSeverity === sev
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
          {filteredAlerts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No alerts matching the selected filter.
            </p>
          )}
        </div>
      </div>

      {/* Customer Health Score Card */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Sample Customer Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthScoreCard
            label="Payment Behavior"
            score={82}
            trend="improving"
          />
          <HealthScoreCard
            label="Financial Stability"
            score={68}
            trend="stable"
          />
          <HealthScoreCard
            label="Engagement Level"
            score={74}
            trend="deteriorating"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  bgColor,
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function DistributionLabel({
  color,
  label,
  count,
  percentage,
}: {
  color: string;
  label: string;
  count: number;
  percentage: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {count} ({percentage}%)
        </p>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: EarlyWarningAlert }) {
  const severityColors = {
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${alert.resolved ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${severityColors[alert.severity]}`}>
              {alert.severity}
            </span>
            <span className="text-xs text-muted-foreground">
              {alert.type.replace(/_/g, ' ')}
            </span>
            {alert.resolved && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Resolved
              </span>
            )}
          </div>
          <p className="text-sm font-medium mb-1">{alert.description}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Recommended:</span> {alert.recommendedAction}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {new Date(alert.triggeredAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function HealthScoreCard({
  label,
  score,
  trend,
}: {
  label: string;
  score: number;
  trend: 'improving' | 'stable' | 'deteriorating';
}) {
  const trendConfig = {
    improving: { color: 'text-green-600', icon: '↑', label: 'Improving' },
    stable: { color: 'text-amber-600', icon: '→', label: 'Stable' },
    deteriorating: { color: 'text-red-600', icon: '↓', label: 'Deteriorating' },
  };

  const config = trendConfig[trend];
  const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
        <span className={`text-xs font-medium ${config.color}`}>
          {config.icon} {config.label}
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// Icons
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}
