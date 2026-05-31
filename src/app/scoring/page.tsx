'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, Brain, TrendingUp, RefreshCw, Plus } from 'lucide-react';

interface ScoringModel {
  id: string;
  name: string;
  type: 'collection' | 'self-cure' | 'roll-rate' | 'amount';
  accuracy: number;
  status: 'production' | 'testing' | 'retired';
  lastTrained: string;
  version: string;
  features: number;
}

const MODELS: ScoringModel[] = [
  {
    id: 'mdl-001',
    name: 'Collection Propensity Score',
    type: 'collection',
    accuracy: 87.3,
    status: 'production',
    lastTrained: '2026-05-25',
    version: '3.2.1',
    features: 42,
  },
  {
    id: 'mdl-002',
    name: 'Self-Cure Prediction',
    type: 'self-cure',
    accuracy: 84.1,
    status: 'production',
    lastTrained: '2026-05-20',
    version: '2.1.0',
    features: 35,
  },
  {
    id: 'mdl-003',
    name: 'Roll Rate Estimator',
    type: 'roll-rate',
    accuracy: 79.8,
    status: 'production',
    lastTrained: '2026-05-18',
    version: '1.4.2',
    features: 28,
  },
  {
    id: 'mdl-004',
    name: 'Recovery Amount Predictor',
    type: 'amount',
    accuracy: 72.5,
    status: 'testing',
    lastTrained: '2026-05-28',
    version: '0.9.0',
    features: 51,
  },
  {
    id: 'mdl-005',
    name: 'Next-Gen Collection Score (v4)',
    type: 'collection',
    accuracy: 91.2,
    status: 'testing',
    lastTrained: '2026-05-30',
    version: '4.0.0-beta',
    features: 68,
  },
];

const TYPE_LABELS: Record<ScoringModel['type'], string> = {
  collection: 'Collection Score',
  'self-cure': 'Self-Cure',
  'roll-rate': 'Roll Rate',
  amount: 'Amount Estimation',
};

const STATUS_BADGE: Record<ScoringModel['status'], string> = {
  production: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  testing: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  retired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function ScoringPage() {
  return (
    <>
      <AppHeader title="Scoring Models" description="ML model management" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950">
                    <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{MODELS.length}</p>
                    <p className="text-xs text-muted-foreground">Total Models</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {MODELS.filter((m) => m.status === 'production').length}
                    </p>
                    <p className="text-xs text-muted-foreground">In Production</p>
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
                    <p className="text-2xl font-bold">87.3%</p>
                    <p className="text-xs text-muted-foreground">Best Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950">
                    <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5d</p>
                    <p className="text-xs text-muted-foreground">Since Last Train</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Model Library</h2>
            <Button className="cursor-pointer gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Train New Model
            </Button>
          </div>

          {/* Model Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MODELS.map((model) => (
              <Card key={model.id} className="transition-shadow duration-200 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{model.name}</CardTitle>
                    <Badge className={`${STATUS_BADGE[model.status]} border-0 text-[10px]`}>
                      {model.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {TYPE_LABELS[model.type]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-medium">{model.accuracy}%</span>
                    </div>
                    <Progress value={model.accuracy} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Version</span>
                      <p className="font-mono">{model.version}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Features</span>
                      <p>{model.features}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Last Trained</span>
                      <p>{model.lastTrained}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-7 cursor-pointer text-xs">
                      Details
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 cursor-pointer gap-1 text-xs">
                      <RefreshCw className="h-3 w-3" aria-hidden="true" />
                      Retrain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
