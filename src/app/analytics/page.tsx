'use client';

import { AppHeader } from '@/components/layout/app-header';
import { useCollectionsStore } from '@/lib/store';
import { BUCKET_NAMES, BUCKET_LABELS, BUCKET_COLORS, BucketName } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Brain,
  BarChart3,
} from 'lucide-react';

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

// Simulated trend data
const MONTHLY_TREND = [
  { month: 'Jan', recovered: 2400000, target: 3000000, cases: 450 },
  { month: 'Feb', recovered: 2800000, target: 3000000, cases: 420 },
  { month: 'Mar', recovered: 3200000, target: 3200000, cases: 380 },
  { month: 'Apr', recovered: 3100000, target: 3200000, cases: 395 },
  { month: 'May', recovered: 3600000, target: 3500000, cases: 360 },
];

const ROLL_RATE_DATA = [
  { bucket: 'B1→B2', rate: 18, previous: 22 },
  { bucket: 'B2→B3', rate: 25, previous: 30 },
  { bucket: 'B3→B4', rate: 32, previous: 35 },
  { bucket: 'B4→B5', rate: 40, previous: 45 },
];

const CHANNEL_PERFORMANCE = [
  { channel: 'SMS', contactRate: 85, responseRate: 32, recoveryRate: 18 },
  { channel: 'Email', contactRate: 92, responseRate: 15, recoveryRate: 8 },
  { channel: 'Call', contactRate: 65, responseRate: 48, recoveryRate: 35 },
  { channel: 'WhatsApp', contactRate: 78, responseRate: 42, recoveryRate: 25 },
  { channel: 'Portal', contactRate: 100, responseRate: 55, recoveryRate: 45 },
];

const trendConfig = {
  recovered: { label: 'Recovered', color: '#10B981' },
  target: { label: 'Target', color: '#6B7280' },
} satisfies ChartConfig;

const channelConfig = {
  contactRate: { label: 'Contact Rate', color: '#3B82F6' },
  responseRate: { label: 'Response Rate', color: '#F59E0B' },
  recoveryRate: { label: 'Recovery Rate', color: '#10B981' },
} satisfies ChartConfig;

const PREDICTED_RECOVERY_BY_BUCKET: Record<BucketName, number> = {
  B1: 320000,
  B2: 580000,
  B3: 890000,
  B4: 1150000,
  B5: 1260000,
};

export default function AnalyticsPage() {
  const { records, getStats } = useCollectionsStore();
  const stats = getStats();

  return (
    <>
      <AppHeader title="Analytics" description="Advanced collection analytics & insights" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* KPI Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Recovery Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.overallCollectionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-medium">+2.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Roll Rate (Avg)</p>
                    <p className="text-2xl font-bold">28.8%</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-medium">-4.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Self-Cure Rate</p>
                    <p className="text-2xl font-bold">34.5%</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-medium">+5.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cost per Recovery</p>
                    <p className="text-2xl font-bold">$42</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-medium">-$8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance" className="cursor-pointer gap-2">
                <Target className="h-3 w-3" aria-hidden="true" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="rollrates" className="cursor-pointer gap-2">
                <Activity className="h-3 w-3" aria-hidden="true" />
                Roll Rates
              </TabsTrigger>
              <TabsTrigger value="channels" className="cursor-pointer gap-2">
                <BarChart3 className="h-3 w-3" aria-hidden="true" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="predictions" className="cursor-pointer gap-2">
                <Brain className="h-3 w-3" aria-hidden="true" />
                ML Insights
              </TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Monthly Recovery Trend</CardTitle>
                    <CardDescription>Recovered amount vs target</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={trendConfig} className="h-[250px] w-full">
                      <AreaChart data={MONTHLY_TREND} accessibilityLayer>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="recovered"
                          fill="var(--color-recovered)"
                          fillOpacity={0.2}
                          stroke="var(--color-recovered)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="var(--color-target)"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Bucket Performance</CardTitle>
                    <CardDescription>Collection rate by aging bucket</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.bucketSummaries.map((summary) => (
                      <div key={summary.bucket} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: BUCKET_COLORS[summary.bucket as BucketName] }}
                              aria-hidden="true"
                            />
                            <span>{summary.bucket} — {summary.label}</span>
                          </div>
                          <span className="font-medium">
                            {summary.collectionRate.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={summary.collectionRate} className="h-2" />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{summary.totalAccounts} accounts</span>
                          <span>{formatCurrency(summary.paidAmount)} recovered</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Roll Rates Tab */}
            <TabsContent value="rollrates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Roll Rate Analysis</CardTitle>
                  <CardDescription>
                    Percentage of accounts rolling into the next delinquency bucket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {ROLL_RATE_DATA.map((item) => (
                      <div key={item.bucket} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.bucket}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              Previous: {item.previous}%
                            </span>
                            <Badge
                              className={`border-0 text-[10px] ${
                                item.rate < item.previous
                                  ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              }`}
                            >
                              {item.rate < item.previous ? '↓' : '↑'} {item.rate}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={item.rate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Channel Performance</CardTitle>
                  <CardDescription>
                    Contact, response, and recovery rates by communication channel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={channelConfig} className="h-[300px] w-full">
                    <BarChart data={CHANNEL_PERFORMANCE} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="channel" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="contactRate" fill="var(--color-contactRate)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="responseRate" fill="var(--color-responseRate)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="recoveryRate" fill="var(--color-recoveryRate)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ML Insights Tab */}
            <TabsContent value="predictions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                      Self-Cure Prediction
                    </CardTitle>
                    <CardDescription>
                      ML model identifies customers likely to pay without intervention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md bg-muted p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Model Accuracy</span>
                        <Badge variant="secondary" className="font-mono">87.3%</Badge>
                      </div>
                      <Progress value={87.3} className="mt-2 h-2" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">High self-cure probability</span>
                        <span className="font-medium">142 accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Medium probability</span>
                        <span className="font-medium">89 accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Low probability</span>
                        <span className="font-medium">234 accounts</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      Collection Amount Estimation
                    </CardTitle>
                    <CardDescription>
                      Predicted recoverable amount per segment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md bg-muted p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Predicted Recovery</span>
                        <span className="text-lg font-bold">{formatCurrency(4200000)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Based on current portfolio and active strategies
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      {BUCKET_NAMES.map((bucket) => (
                        <div key={bucket} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: BUCKET_COLORS[bucket] }}
                              aria-hidden="true"
                            />
                            <span className="text-muted-foreground">
                              {bucket} ({BUCKET_LABELS[bucket]})
                            </span>
                          </div>
                          <span className="font-mono text-xs">
                            {formatCurrency(PREDICTED_RECOVERY_BY_BUCKET[bucket])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
