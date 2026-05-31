import { useState } from 'react';

interface CollectionCase {
  id: string;
  customerId: string;
  loanId: string;
  status: string;
  strategy: 'soft' | 'medium' | 'hard' | 'legal';
  totalOverdue: number;
  daysOverdue: number;
  contactAttempts: number;
  selfCureProbability: number;
  nextActionDate: string;
}

interface RecoveryMetrics {
  totalCases: number;
  totalOverdue: number;
  recoveredAmount: number;
  recoveryRate: number;
  avgDaysToResolve: number;
  byStrategy: Array<{ strategy: string; cases: number; recoveryRate: number }>;
}

const MOCK_METRICS: RecoveryMetrics = {
  totalCases: 187,
  totalOverdue: 892400,
  recoveredAmount: 534200,
  recoveryRate: 59.8,
  avgDaysToResolve: 34,
  byStrategy: [
    { strategy: 'soft', cases: 75, recoveryRate: 72.5 },
    { strategy: 'medium', cases: 56, recoveryRate: 58.3 },
    { strategy: 'hard', cases: 37, recoveryRate: 41.2 },
    { strategy: 'legal', cases: 19, recoveryRate: 28.7 },
  ],
};

const MOCK_CASES: CollectionCase[] = [
  { id: '1', customerId: 'C-1001', loanId: 'LN-2024-045', status: 'new', strategy: 'soft', totalOverdue: 2500, daysOverdue: 8, contactAttempts: 0, selfCureProbability: 78, nextActionDate: '2024-12-20' },
  { id: '2', customerId: 'C-1002', loanId: 'LN-2024-032', status: 'contacted', strategy: 'medium', totalOverdue: 8900, daysOverdue: 35, contactAttempts: 3, selfCureProbability: 42, nextActionDate: '2024-12-18' },
  { id: '3', customerId: 'C-1003', loanId: 'LN-2024-018', status: 'promise_to_pay', strategy: 'soft', totalOverdue: 3200, daysOverdue: 22, contactAttempts: 2, selfCureProbability: 65, nextActionDate: '2024-12-25' },
  { id: '4', customerId: 'C-1004', loanId: 'LN-2024-067', status: 'escalated', strategy: 'hard', totalOverdue: 25000, daysOverdue: 68, contactAttempts: 7, selfCureProbability: 15, nextActionDate: '2024-12-16' },
  { id: '5', customerId: 'C-1005', loanId: 'LN-2024-089', status: 'arrangement', strategy: 'medium', totalOverdue: 12400, daysOverdue: 45, contactAttempts: 4, selfCureProbability: 55, nextActionDate: '2024-12-22' },
  { id: '6', customerId: 'C-1006', loanId: 'LN-2024-012', status: 'legal', strategy: 'legal', totalOverdue: 52000, daysOverdue: 95, contactAttempts: 10, selfCureProbability: 8, nextActionDate: '2024-12-30' },
  { id: '7', customerId: 'C-1007', loanId: 'LN-2024-055', status: 'new', strategy: 'soft', totalOverdue: 1800, daysOverdue: 5, contactAttempts: 0, selfCureProbability: 85, nextActionDate: '2024-12-19' },
  { id: '8', customerId: 'C-1008', loanId: 'LN-2024-041', status: 'contacted', strategy: 'hard', totalOverdue: 18500, daysOverdue: 62, contactAttempts: 6, selfCureProbability: 22, nextActionDate: '2024-12-17' },
];

export function CollectionDashboard() {
  const [metrics] = useState<RecoveryMetrics>(MOCK_METRICS);
  const [cases] = useState<CollectionCase[]>(MOCK_CASES);
  const [filterStrategy, setFilterStrategy] = useState<string>('all');

  const filteredCases = filterStrategy === 'all'
    ? cases
    : cases.filter((c) => c.strategy === filterStrategy);

  return (
    <div className="space-y-6">
      {/* Recovery Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Overdue"
          value={`$${(metrics.totalOverdue / 1000).toFixed(0)}K`}
          icon={<BanknoteIcon className="w-5 h-5 text-red-600" />}
          bgColor="bg-red-50 dark:bg-red-900/20"
        />
        <MetricCard
          label="Recovered"
          value={`$${(metrics.recoveredAmount / 1000).toFixed(0)}K`}
          icon={<TrendingUpIcon className="w-5 h-5 text-green-600" />}
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <MetricCard
          label="Recovery Rate"
          value={`${metrics.recoveryRate}%`}
          icon={<PercentIcon className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <MetricCard
          label="Avg Days to Resolve"
          value={metrics.avgDaysToResolve.toString()}
          icon={<ClockIcon className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50 dark:bg-purple-900/20"
          subtitle={`${metrics.totalCases} active cases`}
        />
      </div>

      {/* Strategy Distribution */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Recovery by Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.byStrategy.map((item) => (
            <div key={item.strategy} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium capitalize">{item.strategy}</span>
                <StrategyBadge strategy={item.strategy} />
              </div>
              <p className="text-lg font-bold">{item.recoveryRate}%</p>
              <p className="text-xs text-muted-foreground">{item.cases} cases</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${item.recoveryRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Collection Cases</h3>
          <div className="flex items-center gap-2">
            {['all', 'soft', 'medium', 'hard', 'legal'].map((strategy) => (
              <button
                key={strategy}
                onClick={() => setFilterStrategy(strategy)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterStrategy === strategy
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Loan</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Overdue</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Days</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Strategy</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Self-Cure</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-3 font-medium">{c.customerId}</td>
                  <td className="py-3 px-3 text-muted-foreground">{c.loanId}</td>
                  <td className="py-3 px-3 text-right font-medium">
                    ${c.totalOverdue.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={c.daysOverdue > 60 ? 'text-red-600 font-medium' : ''}>
                      {c.daysOverdue}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StrategyBadge strategy={c.strategy} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <SelfCureIndicator probability={c.selfCureProbability} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ActionButton icon={<PhoneIcon className="w-3.5 h-3.5" />} title="Contact" />
                      <ActionButton icon={<CalendarIcon className="w-3.5 h-3.5" />} title="Arrange" />
                      <ActionButton icon={<ArrowUpIcon className="w-3.5 h-3.5" />} title="Escalate" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function StrategyBadge({ strategy }: { strategy: string }) {
  const colors: Record<string, string> = {
    soft: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    hard: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    legal: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${colors[strategy] || 'bg-muted'}`}>
      {strategy}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    contacted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    promise_to_pay: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    arrangement: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    escalated: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    legal: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const label = status.replace(/_/g, ' ');

  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${colors[status] || 'bg-muted'}`}>
      {label}
    </span>
  );
}

function SelfCureIndicator({ probability }: { probability: number }) {
  const color = probability >= 60 ? 'text-green-600' : probability >= 30 ? 'text-amber-600' : 'text-red-600';
  const bgColor = probability >= 60 ? 'bg-green-500' : probability >= 30 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bgColor}`} style={{ width: `${probability}%` }} />
      </div>
      <span className={`text-xs font-medium ${color}`}>{probability}%</span>
    </div>
  );
}

function ActionButton({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {icon}
    </button>
  );
}

// Icons
function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function PercentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7a2 2 0 100 4 2 2 0 000-4zM15 13a2 2 0 100 4 2 2 0 000-4zM6 18L18 6" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  );
}
