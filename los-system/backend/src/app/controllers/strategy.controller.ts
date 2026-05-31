import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { strategyService } from '../../domain/strategy/strategy.service.js';

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['rule', 'scorecard', 'decision_table', 'ml_model', 'split', 'merge', 'output']),
  name: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.unknown()),
});

const connectionSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  condition: z.record(z.unknown()).optional(),
});

export const createStrategySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  nodes: z.array(nodeSchema).default([]),
  connections: z.array(connectionSchema).default([]),
  inputSchema: z.record(z.string()).optional(),
  outputSchema: z.record(z.string()).optional(),
});

export const simulationSchema = z.object({
  sampleSize: z.number().int().min(10).max(10000).default(1000),
  datasetFilter: z.record(z.unknown()).optional(),
});

export const championChallengerSchema = z.object({
  championId: z.string().uuid(),
  challengerId: z.string().uuid(),
  trafficSplit: z.number().int().min(1).max(50),
});

export class StrategyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createStrategySchema.parse(req.body);
      const strategyId = await strategyService.createStrategy({
        ...input,
        createdBy: req.user?.userId,
      });

      res.status(201).json({ success: true, data: { id: strategyId } });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const strategies = await strategyService.listStrategies();
      res.json({ success: true, data: strategies });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const strategy = await strategyService.getStrategy(id);
      res.json({ success: true, data: strategy });
    } catch (err) {
      next(err);
    }
  }

  async deploy(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      await strategyService.deployStrategy(id);
      res.json({ success: true, message: 'Strategy deployed as champion' });
    } catch (err) {
      next(err);
    }
  }

  async simulate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { sampleSize, datasetFilter } = simulationSchema.parse(req.body);

      const result = await strategyService.runSimulation({
        strategyId: id,
        sampleSize,
        datasetFilter,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async setupChampionChallenger(req: Request, res: Response, next: NextFunction) {
    try {
      const input = championChallengerSchema.parse(req.body);
      const id = await strategyService.setupChampionChallenger(input);

      res.status(201).json({ success: true, data: { id } });
    } catch (err) {
      next(err);
    }
  }
}

export const strategyController = new StrategyController();
