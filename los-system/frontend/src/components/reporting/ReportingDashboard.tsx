import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PipelineReport {
  totalApplications: number;
  totalActive: number;
  conversionRate: number;
  avgProcessingDays: number;
  byStage: Array<{ stage: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

interface TatReport {
  overall: { avgHours: number; medianHours: number; p95Hours: number };
  byStage: Array<{ stage: string; avgHours: number; count: number }>;
}

interface OfficerPerformance {
  officerId: string;
  officerName: string;
  activeCases: number;
  completedThisMonth: number;
  avgProcessingHours: number;
  slaBreachRate: number;
}

export function ReportingDashboard() {
  const { data: pipelineData } = useQuery({
    queryKey: ['report-pipeline'],
    queryFn: () => api.get<{ success: boolean; data: PipelineReport }>('/reports/pipeline'),
  });

  const { data: tatData } = useQuery({
    queryKey: ['report-tat'],
    queryFn: () => api.get<{ success: boolean; data: TatReport }>('/reports/tat'),
  });

  const { data: officerData } = useQuery({
    queryKey: ['report-officers'],
    queryFn: () => api.get<{ success: boolean; data: OfficerPerformance[] }>('/reports/officers'),
  });

  const pipeline = pipelineData?.data;
  const tat = tatData?.data;
  const officers = officerData?.data || [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Reports & Analytics</h2>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Applications"
          value={pipeline?.totalApplications || 0}
          format="number"
        />
        <KpiCard
          title="Active Cases"
          value={pipeline?.totalActive || 0}
          format="number"
        />
        <KpiCard
          title="Conversion Rate"
          value={pipeline?.conversionRate || 0}
          format="percent"
        />
        <KpiCard
          title="Avg Processing"
          value={pipeline?.avgProcessingDays || 0}
          format="days"
        />
      </div>

      {/* TAT Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-5">
          <h3 className="text-sm font-semibold mb-4">Turnaround Time (TAT)</h3>
          {tat ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-lg font-bold">{tat.overall.avgHours}h</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Median</p>
                  <p className="text-lg font-bold">{tat.overall.medianHours}h</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">P95</p>
                  <p className="text-lg font-bold">{tat.overall.p95Hours}h</p>
                </div>
              </div>

              <div className="space-y-2">
                {tat.byStage.map((stage) => (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="text-xs w-28 text-muted-foreground">{stage.stage}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min((stage.avgHours / (tat.overall.p95Hours || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right">{stage.avgHours}h</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 bg-muted animate-pulse rounded" />
          )}
        </div>

        {/* Officer Performance */}
        <div className="bg-card rounded-lg border p-5">
          <h3 className="text-sm font-semibold mb-4">Officer Performance</h3>
          {officers.length > 0 ? (
            <div className="space-y-3">
              {officers.map((officer) => (
                <div
                  key={officer.officerId}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {officer.officerName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{officer.officerName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {officer.activeCases} active · {officer.completedThisMonth} completed this month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{officer.avgProcessingHours}h avg</p>
                    <p className={`text-[10px] ${
                      officer.slaBreachRate > 10 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {officer.slaBreachRate}% breach
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No performance data available
            </p>
          )}
        </div>
      </div>

      {/* Pipeline by Status */}
      {pipeline && (
        <div className="bg-card rounded-lg border p-5">
          <h3 className="text-sm font-semibold mb-4">Application Status Distribution</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {pipeline.byStatus.map((item) => (
              <div
                key={item.status}
                className="px-3 py-2 bg-muted/50 rounded-lg text-center min-w-[100px]"
              >
                <p className="text-lg font-bold">{item.count}</p>
                <p className="text-[10px] text-muted-foreground">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  format,
}: {
  title: string;
  value: number;
  format: 'number' | 'percent' | 'days';
}) {
  const formatted = format === 'percent'
    ? `${value.toFixed(1)}%`
    : format === 'days'
      ? `${value.toFixed(1)}d`
      : value.toLocaleString();

  return (
    <div className="bg-card rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{formatted}</p>
    </div>
  );
}
