'use client';

import { BucketSummary, BUCKET_COLORS, BucketName } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface BucketProgressProps {
  summaries: BucketSummary[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BucketProgress({ summaries }: BucketProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Progress</CardTitle>
        <CardDescription>Recovery rate per bucket</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {summaries.map((summary) => (
          <div key={summary.bucket} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: BUCKET_COLORS[summary.bucket as BucketName] }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">
                  {summary.bucket} — {summary.label}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {summary.collectionRate.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={summary.collectionRate}
              className="h-2"
              aria-label={`${summary.bucket} collection rate: ${summary.collectionRate.toFixed(1)}%`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{summary.totalAccounts} accounts</span>
              <span>
                {formatCurrency(summary.paidAmount)} / {formatCurrency(summary.totalAmount)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
