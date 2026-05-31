'use client';

import { BucketSummary, BUCKET_COLORS, BucketName } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BucketChartProps {
  summaries: BucketSummary[];
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

const chartConfig = {
  totalAmount: {
    label: 'Outstanding',
    color: '#3B82F6',
  },
  paidAmount: {
    label: 'Collected',
    color: '#10B981',
  },
} satisfies ChartConfig;

export function BucketChart({ summaries }: BucketChartProps) {
  const chartData = summaries.map((s) => ({
    bucket: `${s.bucket} (${s.label})`,
    totalAmount: s.totalAmount,
    paidAmount: s.paidAmount,
    fill: BUCKET_COLORS[s.bucket as BucketName],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections by Bucket</CardTitle>
        <CardDescription>Outstanding vs collected amounts per aging bucket</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="bucket"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.split(' ')[0]}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="totalAmount"
              fill="var(--color-totalAmount)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="paidAmount"
              fill="var(--color-paidAmount)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
