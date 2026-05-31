'use client';

import { CollectionRecord, STATUS_LABELS, StatusType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Pie, PieChart, Cell } from 'recharts';

interface StatusDistributionProps {
  records: CollectionRecord[];
}

const STATUS_CHART_COLORS: Record<StatusType, string> = {
  pending: '#6B7280',
  contacted: '#3B82F6',
  promised: '#F59E0B',
  paid: '#10B981',
  'written-off': '#EF4444',
};

const chartConfig = {
  pending: { label: 'Pending', color: '#6B7280' },
  contacted: { label: 'Contacted', color: '#3B82F6' },
  promised: { label: 'Promise to Pay', color: '#F59E0B' },
  paid: { label: 'Paid', color: '#10B981' },
  'written-off': { label: 'Written Off', color: '#EF4444' },
} satisfies ChartConfig;

export function StatusDistribution({ records }: StatusDistributionProps) {
  const statusCounts = Object.entries(STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
    count: records.filter((r) => r.status === status).length,
    fill: STATUS_CHART_COLORS[status as StatusType],
  })).filter((item) => item.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>Account status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {statusCounts.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={statusCounts}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {statusCounts.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-3">
              {statusCounts.map((item) => (
                <div key={item.status} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.label} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
