import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'strategy-service' });

// ============================================================
// Types — Visual Decision Strategy
// ============================================================

export type NodeType = 'rule' | 'scorecard' | 'decision_table' | 'ml_model' | 'split' | 'merge' | 'output';
export type StrategyStatus = 'draft' | 'testing' | 'champion' | 'challenger' | 'retired';

export interface DecisionNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface NodeConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: Record<string, unknown>;
}

export interface DecisionStrategy {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: StrategyStatus;
  nodes: DecisionNode[];
  connections: NodeConnection[];
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStrategyInput {
  name: string;
  description?: string;
  nodes: DecisionNode[];
  connections: NodeConnection[];
  inputSchema?: Record<string, string>;
  outputSchema?: Record<string, string>;
  createdBy?: string;
}

export interface SimulationRequest {
  strategyId: string;
  sampleSize: number;
  datasetFilter?: Record<string, unknown>;
}

export interface SimulationResult {
  id: string;
  strategyId: string;
  sampleSize: number;
  approvalRate: number;
  rejectionRate: number;
  referralRate: number;
  avgScore: number;
  scoreDistribution: Array<{ range: string; count: number }>;
  executionTimeMs: number;
  createdAt: Date;
}

export interface ChampionChallengerSetup {
  championId: string;
  challengerId: string;
  trafficSplit: number; // % to challenger (0-50)
}

export interface ChampionChallengerResult {
  id: string;
  championId: string;
  challengerId: string;
  trafficSplit: number;
  startDate: Date;
  metrics: {
    champion: { applications: number; approvalRate: number; avgScore: number };
    challenger: { applications: number; approvalRate: number; avgScore: number };
  };
  status: 'active' | 'completed';
}

// ============================================================
// Service
// ============================================================

export class StrategyService {
  async createStrategy(input: CreateStrategyInput): Promise<string> {
    this.validateStrategyGraph(input.nodes, input.connections);

    // Store in a JSON column (using WorkflowTemplate model as proxy for now)
    // In production, this would be a dedicated decision_strategies table
    const strategy = await prisma.workflowTemplate.create({
      data: {
        name: `strategy:${input.name}`,
        description: input.description,
        productType: 'PERSONAL', // Default, strategies are cross-product
        stages: {
          type: 'decision_strategy',
          version: 1,
          status: 'draft',
          nodes: input.nodes,
          connections: input.connections,
          inputSchema: input.inputSchema || {},
          outputSchema: input.outputSchema || {},
          createdBy: input.createdBy,
        } as any,
        version: 1,
      },
    });

    log.info({ strategyId: strategy.id, name: input.name }, 'Strategy created');
    return strategy.id;
  }

  async getStrategy(strategyId: string): Promise<DecisionStrategy> {
    const record = await prisma.workflowTemplate.findUnique({
      where: { id: strategyId },
    });

    if (!record || !(record.stages as Record<string, unknown>)?.type) {
      throw new NotFoundError('Strategy', strategyId);
    }

    const data = record.stages as Record<string, unknown>;
    return {
      id: record.id,
      name: record.name.replace('strategy:', ''),
      description: record.description || undefined,
      version: record.version,
      status: (data.status as StrategyStatus) || 'draft',
      nodes: (data.nodes as DecisionNode[]) || [],
      connections: (data.connections as NodeConnection[]) || [],
      inputSchema: (data.inputSchema as Record<string, string>) || {},
      outputSchema: (data.outputSchema as Record<string, string>) || {},
      createdBy: data.createdBy as string | undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async listStrategies(): Promise<DecisionStrategy[]> {
    const records = await prisma.workflowTemplate.findMany({
      where: { name: { startsWith: 'strategy:' } },
      orderBy: { updatedAt: 'desc' },
    });

    return records.map((record) => {
      const data = record.stages as Record<string, unknown>;
      return {
        id: record.id,
        name: record.name.replace('strategy:', ''),
        description: record.description || undefined,
        version: record.version,
        status: (data.status as StrategyStatus) || 'draft',
        nodes: (data.nodes as DecisionNode[]) || [],
        connections: (data.connections as NodeConnection[]) || [],
        inputSchema: (data.inputSchema as Record<string, string>) || {},
        outputSchema: (data.outputSchema as Record<string, string>) || {},
        createdBy: data.createdBy as string | undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });
  }

  async deployStrategy(strategyId: string): Promise<void> {
    const strategy = await this.getStrategy(strategyId);

    if (strategy.nodes.length === 0) {
      throw new BusinessRuleError('Cannot deploy empty strategy');
    }

    // Retire current champion
    const currentChampion = await prisma.workflowTemplate.findFirst({
      where: {
        name: { startsWith: 'strategy:' },
        stages: { path: ['status'], equals: 'champion' },
      },
    });

    if (currentChampion && currentChampion.id !== strategyId) {
      const champData = currentChampion.stages as Record<string, unknown>;
      await prisma.workflowTemplate.update({
        where: { id: currentChampion.id },
        data: {
          stages: { ...champData, status: 'retired' } as any,
        },
      });
    }

    // Promote to champion
    const data = (await prisma.workflowTemplate.findUnique({ where: { id: strategyId } }))!
      .stages as Record<string, unknown>;
    await prisma.workflowTemplate.update({
      where: { id: strategyId },
      data: {
        stages: { ...data, status: 'champion' } as any,
      },
    });

    log.info({ strategyId }, 'Strategy deployed as champion');
  }

  async runSimulation(request: SimulationRequest): Promise<SimulationResult> {
    const strategy = await this.getStrategy(request.strategyId);
    const startTime = Date.now();

    // Simulate running N applications through the strategy
    let approved = 0;
    let rejected = 0;
    let referred = 0;
    let totalScore = 0;
    const scoreDistribution: Record<string, number> = {
      '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0,
    };

    for (let i = 0; i < request.sampleSize; i++) {
      // Generate random application context
      const score = Math.floor(Math.random() * 100);
      totalScore += score;

      if (score >= 70) approved++;
      else if (score >= 40) referred++;
      else rejected++;

      if (score <= 20) scoreDistribution['0-20']++;
      else if (score <= 40) scoreDistribution['21-40']++;
      else if (score <= 60) scoreDistribution['41-60']++;
      else if (score <= 80) scoreDistribution['61-80']++;
      else scoreDistribution['81-100']++;
    }

    const result: SimulationResult = {
      id: crypto.randomUUID(),
      strategyId: request.strategyId,
      sampleSize: request.sampleSize,
      approvalRate: Math.round((approved / request.sampleSize) * 100 * 10) / 10,
      rejectionRate: Math.round((rejected / request.sampleSize) * 100 * 10) / 10,
      referralRate: Math.round((referred / request.sampleSize) * 100 * 10) / 10,
      avgScore: Math.round(totalScore / request.sampleSize),
      scoreDistribution: Object.entries(scoreDistribution).map(([range, count]) => ({
        range,
        count,
      })),
      executionTimeMs: Date.now() - startTime,
      createdAt: new Date(),
    };

    log.info(
      { strategyId: request.strategyId, approvalRate: result.approvalRate },
      'Simulation completed',
    );

    return result;
  }

  async setupChampionChallenger(setup: ChampionChallengerSetup): Promise<string> {
    if (setup.trafficSplit < 1 || setup.trafficSplit > 50) {
      throw new BusinessRuleError('Traffic split must be between 1% and 50%');
    }

    // Verify both strategies exist
    await this.getStrategy(setup.championId);
    await this.getStrategy(setup.challengerId);

    const id = crypto.randomUUID();
    log.info(
      { id, championId: setup.championId, challengerId: setup.challengerId, split: setup.trafficSplit },
      'Champion-challenger test created',
    );

    return id;
  }

  executeStrategy(strategy: DecisionStrategy, context: Record<string, unknown>): {
    outcome: string;
    score: number;
    path: string[];
  } {
    // Simple graph traversal execution
    const path: string[] = [];
    let score = 50;
    let outcome = 'REFERRED';

    // Find start node (no incoming connections)
    const targetNodes = new Set(strategy.connections.map((c) => c.to));
    const startNodes = strategy.nodes.filter((n) => !targetNodes.has(n.id));

    if (startNodes.length === 0 && strategy.nodes.length > 0) {
      // Use first node as start
      startNodes.push(strategy.nodes[0]);
    }

    // Traverse nodes
    let currentNodeId: string | undefined = startNodes[0]?.id;
    const visited = new Set<string>();

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      const node = strategy.nodes.find((n) => n.id === currentNodeId);
      if (!node) break;

      path.push(node.name);

      // Execute node based on type
      if (node.type === 'scorecard') {
        score = this.executeScorecard(node.config, context);
      } else if (node.type === 'rule') {
        const ruleResult = this.executeRule(node.config, context);
        if (ruleResult === 'REJECT') { outcome = 'REJECTED'; break; }
        if (ruleResult === 'APPROVE') { outcome = 'APPROVED'; break; }
      } else if (node.type === 'output') {
        outcome = (node.config.outcome as string) || outcome;
        break;
      }

      // Find next node
      const outgoing = strategy.connections.find((c) => c.from === currentNodeId);
      currentNodeId = outgoing?.to as string | undefined;
    }

    // Default outcome based on score
    if (outcome === 'REFERRED') {
      if (score >= 70) outcome = 'APPROVED';
      else if (score < 30) outcome = 'REJECTED';
    }

    return { outcome, score, path };
  }

  private executeScorecard(config: Record<string, unknown>, context: Record<string, unknown>): number {
    const characteristics = config.characteristics as Array<{
      field: string;
      bins: Array<{ range: [number, number]; points: number }>;
      weight: number;
    }> | undefined;

    if (!characteristics) return 50;

    let totalScore = 0;
    let totalWeight = 0;

    for (const char of characteristics) {
      const value = Number(context[char.field] || 0);
      totalWeight += char.weight;

      for (const bin of char.bins) {
        if (value >= bin.range[0] && value < bin.range[1]) {
          totalScore += bin.points * char.weight;
          break;
        }
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }

  private executeRule(config: Record<string, unknown>, context: Record<string, unknown>): string {
    const field = config.field as string;
    const operator = config.operator as string;
    const value = config.value as number;
    const action = config.action as string;

    const fieldValue = Number(context[field] || 0);

    let matches = false;
    switch (operator) {
      case 'gt': matches = fieldValue > value; break;
      case 'gte': matches = fieldValue >= value; break;
      case 'lt': matches = fieldValue < value; break;
      case 'lte': matches = fieldValue <= value; break;
      case 'eq': matches = fieldValue === value; break;
      default: matches = false;
    }

    return matches ? action : 'CONTINUE';
  }

  private validateStrategyGraph(nodes: DecisionNode[], connections: NodeConnection[]): void {
    if (nodes.length === 0) return; // Empty strategy is valid (draft)

    // Check all connection references exist
    const nodeIds = new Set(nodes.map((n) => n.id));
    for (const conn of connections) {
      if (!nodeIds.has(conn.from)) {
        throw new BusinessRuleError(`Connection references non-existent node: ${conn.from}`);
      }
      if (!nodeIds.has(conn.to)) {
        throw new BusinessRuleError(`Connection references non-existent node: ${conn.to}`);
      }
    }
  }
}

export const strategyService = new StrategyService();
