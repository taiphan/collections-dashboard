import { useQuery } from '@tanstack/react-query';
import { casesApi } from '@/lib/api';
import type { DashboardStats } from '@/types';

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  INTAKE: { label: 'Intake', color: 'bg-stage-intake' },
  VERIFICATION: { label: 'Verification', color: 'bg-stage-verification' },
  UNDERWRITING: { label: 'Underwriting', color: 'bg-stage-underwriting' },
  APPROVAL: { label: 'Approval', color: 'bg-stage-approval' },
  DOCUMENTATION: { label: 'Documentation', color: 'bg-stage-documentation' },
  DISBURSEMENT: { label: 'Disbursement', color: 'bg-stage-disbursement' },
  CLOSED: { label: 'Closed', color: 'bg-stage-closed' },
};

export function DashboardHome() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => casesApi.dashboard(),
  });

  const stats = data?.data as DashboardStats | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Cases"
          value={stats?.totalActive || 0}
          icon="📋"
          color="text-primary"
        />
        <StatCard
          title="SLA Breached"
          value={stats?.slaBreached || 0}
          icon="⚠️"
          color="text-destructive"
        />
        <StatCard
          title="In Underwriting"
          value={
            stats?.byStage?.find((s) => s.currentStage === 'UNDERWRITING')?._count || 0
          }
          icon="🔍"
          color="text-amber-600"
        />
        <StatCard
          title="Pending Approval"
          value={
            stats?.byStage?.find((s) => s.currentStage === 'APPROVAL')?._count || 0
          }
          icon="✅"
          color="text-green-600"
        />
      </div>

      {/* Pipeline by Stage */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-sm font-semibold mb-4">Pipeline by Stage</h3>
        <div className="flex items-end gap-2 h-40">
          {Object.entries(STAGE_LABELS).map(([stage, config]) => {
            const count = stats?.byStage?.find(
              (s) => s.currentStage === stage,
            )?._count || 0;
            const maxCount = Math.max(
              ...(stats?.byStage?.map((s) => s._count) || [1]),
            );
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium">{count}</span>
                <div
                  className={`w-full rounded-t ${config.color} transition-all`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          title="New Application"
          description="Start a new loan application"
          icon="➕"
        />
        <QuickAction
          title="My Work Queue"
          description="View cases assigned to you"
          icon="📥"
        />
        <QuickAction
          title="SLA Alerts"
          description="Cases approaching deadline"
          icon="🔔"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{title}</p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <button className="bg-card rounded-lg border p-4 text-left hover:border-primary/50 hover:shadow-sm transition-all">
      <span className="text-xl">{icon}</span>
      <h4 className="font-medium text-sm mt-2">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
