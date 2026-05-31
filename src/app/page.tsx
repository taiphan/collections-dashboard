'use client';

import { useCollectionsStore } from '@/lib/store';
import { AppHeader } from '@/components/layout/app-header';
import { DashboardHeader } from '@/components/dashboard/header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { BucketChart } from '@/components/dashboard/bucket-chart';
import { BucketProgress } from '@/components/dashboard/bucket-progress';
import { StatusDistribution } from '@/components/dashboard/status-distribution';
import { CollectionsTable } from '@/components/dashboard/collections-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const { records, getStats } = useCollectionsStore();
  const stats = getStats();
  const hasData = records.length > 0;

  return (
    <>
      <AppHeader title="Dashboard" description="Portfolio overview & KPIs" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <DashboardHeader />

          {!hasData ? (
            <EmptyState />
          ) : (
            <>
              <StatsCards stats={stats} />

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview" className="cursor-pointer">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="records" className="cursor-pointer">
                    All Records
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <BucketChart summaries={stats.bucketSummaries} />
                    <BucketProgress summaries={stats.bucketSummaries} />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <CollectionsTable />
                    </div>
                    <StatusDistribution records={records} />
                  </div>
                </TabsContent>

                <TabsContent value="records">
                  <CollectionsTable />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </>
  );
}
