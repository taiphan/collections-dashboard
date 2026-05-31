'use client';

import { DailySummary } from '@/lib/types';
import { getSeverity, SEVERITY_BG } from '@/lib/types';
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
import { format, parseISO } from 'date-fns';

interface DailyDetailTableProps {
  summaries: DailySummary[];
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function DailyDetailTable({ summaries }: DailyDetailTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Detail</CardTitle>
        <CardDescription>Full breakdown of data flow per day and source</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Card V+ BOD</TableHead>
                <TableHead className="text-right">Card V+ Pega</TableHead>
                <TableHead className="text-right">Card V+ Diff</TableHead>
                <TableHead className="text-right">Loan BOD</TableHead>
                <TableHead className="text-right">Loan Pega</TableHead>
                <TableHead className="text-right">Loan Diff</TableHead>
                <TableHead className="text-right">Total Diff %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No data available. Import pipeline data to get started.
                  </TableCell>
                </TableRow>
              ) : (
                [...summaries].reverse().map((summary) => {
                  const totalSeverity = getSeverity(summary.totalDiffPercent);
                  return (
                    <TableRow key={summary.date}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(parseISO(summary.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(summary.cardVPlusBod)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(summary.cardVPlusPega)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <Badge
                          className={`${SEVERITY_BG[getSeverity(summary.cardVPlusDiffPercent)]} border-0 font-mono`}
                        >
                          {summary.cardVPlusDiff.toLocaleString()} ({summary.cardVPlusDiffPercent.toFixed(1)}%)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(summary.loanFinaleBod)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(summary.loanFinalePega)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <Badge
                          className={`${SEVERITY_BG[getSeverity(summary.loanFinaleDiffPercent)]} border-0 font-mono`}
                        >
                          {summary.loanFinaleDiff.toLocaleString()} ({summary.loanFinaleDiffPercent.toFixed(1)}%)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={`${SEVERITY_BG[totalSeverity]} border-0 font-mono font-bold`}
                        >
                          {summary.totalDiffPercent.toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
