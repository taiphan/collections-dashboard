'use client';

import { ComparisonData } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Database, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface StatsCardsProps {
  comparison: ComparisonData;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function TrendIcon({ direction }: { direction: 'improving' | 'stable' | 'degrading' }) {
  if (direction === 'improving') {
    return <TrendingDown className="h-4 w-4 text-green-600" aria-hidden="true" />;
  }
  if (direction === 'degrading') {
    return <TrendingUp className="h-4 w-4 text-red-600" aria-hidden="true" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
}

function TrendLabel({ direction }: { direction: 'improving' | 'stable' | 'degrading' }) {
  const labels = {
    improving: 'Improving',
    stable: 'Stable',
    degrading: 'Degrading',
  };
  const colors = {
    improving: 'text-green-600 dark:text-green-400',
    stable: 'text-muted-foreground',
    degrading: 'text-red-600 dark:text-red-400',
  };
  return <span className={`text-xs font-medium ${colors[direction]}`}>{labels[direction]}</span>;
}

export function StatsCards({ comparison }: StatsCardsProps) {
  const { today, sevenDayAvg, trend } = comparison;

  if (!today) return null;

  const cards = [
    {
      title: 'Total BOD Today',
      value: formatNumber(today.totalBod),
      subtitle: sevenDayAvg ? `7-day avg: ${formatNumber(sevenDayAvg.totalBod)}` : 'No prior data',
      icon: Database,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Total in Pega',
      value: formatNumber(today.totalPega),
      subtitle: sevenDayAvg ? `7-day avg: ${formatNumber(sevenDayAvg.totalPega)}` : 'No prior data',
      icon: ArrowRightLeft,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Today Difference',
      value: `${today.totalDiff.toLocaleString()} (${today.totalDiffPercent.toFixed(2)}%)`,
      subtitle: sevenDayAvg
        ? `7-day avg: ${sevenDayAvg.totalDiff.toLocaleString()} (${sevenDayAvg.totalDiffPercent.toFixed(2)}%)`
        : 'No prior data',
      icon: AlertTriangle,
      color: today.totalDiffPercent > 3
        ? 'text-red-600 dark:text-red-400'
        : today.totalDiffPercent > 1
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-green-600 dark:text-green-400',
      bgColor: today.totalDiffPercent > 3
        ? 'bg-red-50 dark:bg-red-950'
        : today.totalDiffPercent > 1
          ? 'bg-amber-50 dark:bg-amber-950'
          : 'bg-green-50 dark:bg-green-950',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{card.value}</div>
            <div className="mt-1 flex items-center gap-2">
              <TrendIcon direction={trend} />
              <TrendLabel direction={trend} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
