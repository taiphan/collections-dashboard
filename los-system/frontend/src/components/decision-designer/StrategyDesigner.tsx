import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DecisionNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

interface Strategy {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: string;
  nodes: DecisionNode[];
  connections: Array<{ id: string; from: string; to: string }>;
  createdAt: string;
}

interface SimulationResult {
  approvalRate: number;
  rejectionRate: number;
  referralRate: number;
  avgScore: number;
  scoreDistribution: Array<{ range: string; count: number }>;
  executionTimeMs: number;
}

const NODE_TYPES = [
  { type: 'rule', label: 'Rule', icon: '⚡', description: 'Single condition check' },
  { type: 'scorecard', label: 'Scorecard', icon: '📊', description: 'Weighted scoring model' },
  { type: 'decision_table', label: 'Decision Table', icon: '📋', description: 'Multi-condition matrix' },
  { type: 'split', label: 'Split', icon: '🔀', description: 'Branch based on condition' },
  { type: 'merge', label: 'Merge', icon: '🔗', description: 'Combine branches' },
  { type: 'output', label: 'Output', icon: '🎯', description: 'Final decision' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  testing: 'bg-blue-100 text-blue-700',
  champion: 'bg-green-100 text-green-700',
  challenger: 'bg-amber-100 text-amber-700',
  retired: 'bg-gray-100 text-gray-500',
};

export function StrategyDesigner() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: strategiesData, isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => api.get<{ success: boolean; data: Strategy[] }>('/strategies'),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<{ success: boolean; data: { id: string } }>('/strategies', {
      name,
      description: 'New decision strategy',
      nodes: [],
      connections: [],
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategies'] }),
  });

  const deployMutation = useMutation({
    mutationFn: (id: string) => api.post(`/strategies/${id}/deploy`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategies'] }),
  });

  const simulateMutation = useMutation({
    mutationFn: (id: string) => api.post<{ success: boolean; data: SimulationResult }>(
      `/strategies/${id}/simulate`,
      { sampleSize: 1000 },
    ),
  });

  const strategies = strategiesData?.data || [];
  const selected = strategies.find((s) => s.id === selectedStrategy);
  const simResult = simulateMutation.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Decision Strategy Designer</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage credit decision strategies visually
          </p>
        </div>
        <button
          onClick={() => {
            const name = prompt('Strategy name:');
            if (name) createMutation.mutate(name);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + New Strategy
        </button>
      </div>

      {/* Strategy List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            onClick={() => setSelectedStrategy(strategy.id)}
            className={`bg-card rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedStrategy === strategy.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{strategy.name}</h4>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                STATUS_COLORS[strategy.status] || ''
              }`}>
                {strategy.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {strategy.nodes.length} nodes · v{strategy.version}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Created: {new Date(strategy.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
        {isLoading && [...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>

      {/* Selected Strategy Detail */}
      {selected && (
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{selected.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => simulateMutation.mutate(selected.id)}
                disabled={simulateMutation.isPending}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
              >
                {simulateMutation.isPending ? 'Running...' : '🧪 Simulate'}
              </button>
              {selected.status === 'draft' && (
                <button
                  onClick={() => deployMutation.mutate(selected.id)}
                  disabled={deployMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  🚀 Deploy
                </button>
              )}
            </div>
          </div>

          {/* Node Palette */}
          <div>
            <h4 className="text-xs font-medium mb-2">Available Node Types</h4>
            <div className="flex flex-wrap gap-2">
              {NODE_TYPES.map((nt) => (
                <div
                  key={nt.type}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs cursor-grab hover:bg-muted/80"
                  title={nt.description}
                >
                  <span>{nt.icon}</span>
                  <span>{nt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas placeholder */}
          <div className="h-64 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Visual Strategy Canvas</p>
              <p className="text-xs mt-1">
                {selected.nodes.length > 0
                  ? `${selected.nodes.length} nodes configured`
                  : 'Drag nodes here to build your strategy'}
              </p>
            </div>
          </div>

          {/* Simulation Results */}
          {simResult && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">
                Simulation Results (n={1000})
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xs text-blue-600">Approval</p>
                  <p className="text-lg font-bold text-green-700">{simResult.approvalRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-blue-600">Rejection</p>
                  <p className="text-lg font-bold text-red-700">{simResult.rejectionRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-blue-600">Referral</p>
                  <p className="text-lg font-bold text-amber-700">{simResult.referralRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-blue-600">Avg Score</p>
                  <p className="text-lg font-bold">{simResult.avgScore}</p>
                </div>
              </div>
              <p className="text-[10px] text-blue-600 mt-2">
                Executed in {simResult.executionTimeMs}ms
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
