'use client';

import { TrendData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';

interface TrendChartProps {
  data: TrendData[];
}

const chartConfig = {
  cardVPlusDiffPercent: {
    label: 'Card V+',
    color: '#3B82F6',
  },
  loanFinaleDiffPercent: {
    label: 'Loan Finacle',
    color: '#8B5CF6',
  },
  totalDiffPercent: {
    label: 'Total',
    color: '#F59E0B',
  },
} satisfies ChartConfig;

export function TrendChart({ data }: TrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'MM/dd'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>7-Day Trend</CardTitle>
        <CardDescription>
          Difference % trend over time — lower is better (closer to 0% = full data sync)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={3}
              stroke="#EF4444"
              strokeDasharray="5 5"
              strokeOpacity={0.4}
              label={{ value: 'Alert threshold', position: 'right', fontSize: 10 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="cardVPlusDiffPercent"
              stroke="var(--color-cardVPlusDiffPercent)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="loanFinaleDiffPercent"
              stroke="var(--color-loanFinaleDiffPercent)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="totalDiffPercent"
              stroke="var(--color-totalDiffPercent)"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
