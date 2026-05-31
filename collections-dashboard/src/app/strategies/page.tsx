'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  GitBranch,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Users,
  Clock,
  Zap,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Strategy {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  type: 'early' | 'mid' | 'late' | 'legal';
  targetBuckets: string[];
  recoveryRate: number;
  casesAssigned: number;
  channels: string[];
  lastModified: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: 'str-001',
    name: 'Early Soft Reminder',
    description: 'Automated SMS and email reminders for B1 accounts within 7 days of due date',
    status: 'active',
    type: 'early',
    targetBuckets: ['B1'],
    recoveryRate: 72,
    casesAssigned: 245,
    channels: ['SMS', 'Email'],
    lastModified: '2026-05-28',
  },
  {
    id: 'str-002',
    name: 'Multi-Channel Escalation',
    description: 'Progressive contact strategy: SMS → Email → Call for B2 accounts',
    status: 'active',
    type: 'mid',
    targetBuckets: ['B2', 'B3'],
    recoveryRate: 58,
    casesAssigned: 189,
    channels: ['SMS', 'Email', 'Call', 'WhatsApp'],
    lastModified: '2026-05-25',
  },
  {
    id: 'str-003',
    name: 'High-Value Recovery',
    description: 'Dedicated collector assignment for accounts > $20,000 in B3-B4',
    status: 'active',
    type: 'late',
    targetBuckets: ['B3', 'B4'],
    recoveryRate: 41,
    casesAssigned: 67,
    channels: ['Call', 'Visit', 'Letter'],
    lastModified: '2026-05-20',
  },
  {
    id: 'str-004',
    name: 'Self-Cure Portal',
    description: 'Digital self-service portal for customers with high self-cure probability',
    status: 'active',
    type: 'early',
    targetBuckets: ['B1', 'B2'],
    recoveryRate: 85,
    casesAssigned: 312,
    channels: ['Portal', 'Email'],
    lastModified: '2026-05-22',
  },
  {
    id: 'str-005',
    name: 'Legal Recovery Path',
    description: 'Escalation to legal action for B5 accounts with no response after 3 attempts',
    status: 'paused',
    type: 'legal',
    targetBuckets: ['B5'],
    recoveryRate: 23,
    casesAssigned: 34,
    channels: ['Letter', 'Legal'],
    lastModified: '2026-05-15',
  },
  {
    id: 'str-006',
    name: 'Agency Outsource — Tier 2',
    description: 'External agency assignment for medium-risk B4 accounts',
    status: 'draft',
    type: 'late',
    targetBuckets: ['B4'],
    recoveryRate: 0,
    casesAssigned: 0,
    channels: ['Agency'],
    lastModified: '2026-05-30',
  },
];

const STATUS_BADGE: Record<Strategy['status'], string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const TYPE_LABELS: Record<Strategy['type'], string> = {
  early: 'Early Stage',
  mid: 'Mid Stage',
  late: 'Late Stage',
  legal: 'Legal',
};

export default function StrategiesPage() {
  const activeStrategies = STRATEGIES.filter((s) => s.status === 'active');
  const avgRecoveryRate =
    activeStrategies.reduce((sum, s) => sum + s.recoveryRate, 0) /
    (activeStrategies.length || 1);
  const totalCases = activeStrategies.reduce((sum, s) => sum + s.casesAssigned, 0);

  return (
    <>
      <AppHeader title="Strategies" description="Collection strategy designer" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Strategy KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950">
                    <Play className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeStrategies.length}</p>
                    <p className="text-xs text-muted-foreground">Active Strategies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgRecoveryRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Avg Recovery Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalCases}</p>
                    <p className="text-xs text-muted-foreground">Cases Assigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">&lt; 24h</p>
                    <p className="text-xs text-muted-foreground">Avg First Contact</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Strategy Library</h2>
            <Button className="cursor-pointer gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Strategy
            </Button>
          </div>

          {/* Strategy Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" className="cursor-pointer">All</TabsTrigger>
              <TabsTrigger value="active" className="cursor-pointer">Active</TabsTrigger>
              <TabsTrigger value="paused" className="cursor-pointer">Paused</TabsTrigger>
              <TabsTrigger value="draft" className="cursor-pointer">Draft</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {STRATEGIES.map((strategy) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {STRATEGIES.filter((s) => s.status === 'active').map((strategy) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="paused" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {STRATEGIES.filter((s) => s.status === 'paused').map((strategy) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="draft" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {STRATEGIES.filter((s) => s.status === 'draft').map((strategy) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-sm">{strategy.name}</CardTitle>
          </div>
          <Badge className={`${STATUS_BADGE[strategy.status]} border-0 text-[10px]`}>
            {strategy.status}
          </Badge>
        </div>
        <CardDescription className="text-xs">{strategy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {strategy.targetBuckets.map((bucket) => (
            <Badge key={bucket} variant="outline" className="text-[10px]">
              {bucket}
            </Badge>
          ))}
          <Badge variant="secondary" className="text-[10px]">
            {TYPE_LABELS[strategy.type]}
          </Badge>
        </div>

        {strategy.status !== 'draft' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Recovery Rate</span>
              <span className="font-medium">{strategy.recoveryRate}%</span>
            </div>
            <Progress value={strategy.recoveryRate} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{strategy.casesAssigned} cases</span>
          <span>{strategy.channels.join(' · ')}</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {strategy.status === 'active' ? (
            <Button variant="outline" size="sm" className="h-7 cursor-pointer gap-1 text-xs">
              <Pause className="h-3 w-3" aria-hidden="true" />
              Pause
            </Button>
          ) : strategy.status === 'paused' ? (
            <Button variant="outline" size="sm" className="h-7 cursor-pointer gap-1 text-xs">
              <Play className="h-3 w-3" aria-hidden="true" />
              Resume
            </Button>
          ) : (
            <Button size="sm" className="h-7 cursor-pointer gap-1 text-xs">
              <Zap className="h-3 w-3" aria-hidden="true" />
              Activate
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 cursor-pointer gap-1 text-xs">
            <Settings className="h-3 w-3" aria-hidden="true" />
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
