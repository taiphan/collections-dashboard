'use client';

import { ComparisonData } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonTableProps {
  comparison: ComparisonData;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function DirectionBadge({ direction }: { direction: 'improving' | 'stable' | 'degrading' }) {
  if (direction === 'improving') {
    return (
      <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
        <TrendingDown className="h-3 w-3" aria-hidden="true" />
        Improving
      </Badge>
    );
  }
  if (direction === 'degrading') {
    return (
      <Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        Degrading
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-0">
      <Minus className="h-3 w-3" aria-hidden="true" />
      Stable
    </Badge>
  );
}

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  const { today, sevenDayAvg, trendDetails } = comparison;

  if (!today || !sevenDayAvg) return null;

  const rows = [
    {
      source: 'Card V+',
      todayBod: today.cardVPlusBod,
      todayPega: today.cardVPlusPega,
      todayDiff: today.cardVPlusDiff,
      todayDiffPct: today.cardVPlusDiffPercent,
      avgBod: sevenDayAvg.cardVPlusBod,
      avgPega: sevenDayAvg.cardVPlusPega,
      avgDiff: sevenDayAvg.cardVPlusDiff,
      avgDiffPct: sevenDayAvg.cardVPlusDiffPercent,
      trend: trendDetails.find((t) => t.source === 'Card V+')?.direction || 'stable',
    },
    {
      source: 'Loan Finacle',
      todayBod: today.loanFinaleBod,
      todayPega: today.loanFinalePega,
      todayDiff: today.loanFinaleDiff,
      todayDiffPct: today.loanFinaleDiffPercent,
      avgBod: sevenDayAvg.loanFinaleBod,
      avgPega: sevenDayAvg.loanFinalePega,
      avgDiff: sevenDayAvg.loanFinaleDiff,
      avgDiffPct: sevenDayAvg.loanFinaleDiffPercent,
      trend: trendDetails.find((t) => t.source === 'Loan Finacle')?.direction || 'stable',
    },
    {
      source: 'TOTAL',
      todayBod: today.totalBod,
      todayPega: today.totalPega,
      todayDiff: today.totalDiff,
      todayDiffPct: today.totalDiffPercent,
      avgBod: sevenDayAvg.totalBod,
      avgPega: sevenDayAvg.totalPega,
      avgDiff: sevenDayAvg.totalDiff,
      avgDiffPct: sevenDayAvg.totalDiffPercent,
      trend: comparison.trend,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today vs 7-Day Average</CardTitle>
        <CardDescription>
          Comparing today&apos;s data flow with the 7-day rolling average
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="align-bottom">Source</TableHead>
                <TableHead colSpan={3} className="text-center border-b-0 text-blue-600 dark:text-blue-400">
                  Today
                </TableHead>
                <TableHead colSpan={3} className="text-center border-b-0 text-muted-foreground">
                  7-Day Avg
                </TableHead>
                <TableHead rowSpan={2} className="text-center align-bottom">Trend</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-right text-xs">BOD</TableHead>
                <TableHead className="text-right text-xs">Pega</TableHead>
                <TableHead className="text-right text-xs">Diff %</TableHead>
                <TableHead className="text-right text-xs">BOD</TableHead>
                <TableHead className="text-right text-xs">Pega</TableHead>
                <TableHead className="text-right text-xs">Diff %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.source} className={row.source === 'TOTAL' ? 'font-semibold border-t-2' : ''}>
                  <TableCell className="font-medium">{row.source}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(row.todayBod)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(row.todayPega)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm ${
                    row.todayDiffPct > 3 ? 'text-red-600 dark:text-red-400' :
                    row.todayDiffPct > 1 ? 'text-amber-600 dark:text-amber-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {row.todayDiffPct.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatNumber(row.avgBod)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatNumber(row.avgPega)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {row.avgDiffPct.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <DirectionBadge direction={row.trend} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
