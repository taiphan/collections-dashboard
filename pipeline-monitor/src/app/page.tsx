'use client';

import { usePipelineStore } from '@/lib/store';
import { DashboardHeader } from '@/components/dashboard/header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { Heatmap } from '@/components/dashboard/heatmap';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { ComparisonTable } from '@/components/dashboard/comparison-table';
import { DailyDetailTable } from '@/components/dashboard/daily-detail-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const {
    records,
    getDailySummaries,
    getTrendData,
    getHeatmapData,
    getTodayVs7DayComparison,
    getLatestDate,
  } = usePipelineStore();

  const hasData = records.length > 0;
  const summaries = getDailySummaries(7);
  const trendData = getTrendData(7);
  const heatmapData = getHeatmapData(7);
  const comparison = getTodayVs7DayComparison();
  const latestDate = getLatestDate();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <DashboardHeader />

        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* Latest date indicator */}
            {latestDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                Latest data: {format(parseISO(latestDate), 'MMMM d, yyyy')}
              </div>
            )}

            {/* KPI Cards */}
            <StatsCards comparison={comparison} />

            {/* Heatmap - primary visualization */}
            <Heatmap data={heatmapData} />

            {/* Trend + Comparison side by side */}
            <div className="grid gap-4 lg:grid-cols-2">
              <TrendChart data={trendData} />
              <ComparisonTable comparison={comparison} />
            </div>

            {/* Full detail table */}
            <DailyDetailTable summaries={summaries} />
          </>
        )}
      </div>
    </main>
  );
}
