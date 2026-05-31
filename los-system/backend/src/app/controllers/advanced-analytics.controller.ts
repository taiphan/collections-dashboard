import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { advancedAnalyticsService } from '../../domain/advanced-analytics/advanced-analytics.service.js';

const predictSchema = z.object({
  inputData: z.record(z.unknown()),
});

const compareModelsSchema = z.object({
  modelIdA: z.string().min(1),
  modelIdB: z.string().min(1),
});

export class AdvancedAnalyticsController {
  async listModels(req: Request, res: Response, next: NextFunction) {
    try {
      const models = await advancedAnalyticsService.listModels();

      res.json({ success: true, data: models });
    } catch (err) {
      next(err);
    }
  }

  async predict(req: Request, res: Response, next: NextFunction) {
    try {
      const { modelId } = req.params as { modelId: string };
      const { inputData } = predictSchema.parse(req.body);
      const result = await advancedAnalyticsService.predict(modelId, inputData);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getGovernance(req: Request, res: Response, next: NextFunction) {
    try {
      const { modelId } = req.params as { modelId: string };
      const records = await advancedAnalyticsService.getModelGovernance(modelId);

      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async checkDrift(req: Request, res: Response, next: NextFunction) {
    try {
      const { modelId } = req.params as { modelId: string };
      const report = await advancedAnalyticsService.checkModelDrift(modelId);

      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async compareModels(req: Request, res: Response, next: NextFunction) {
    try {
      const { modelIdA, modelIdB } = compareModelsSchema.parse(req.body);
      const result = await advancedAnalyticsService.compareModels(modelIdA, modelIdB);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const advancedAnalyticsController = new AdvancedAnalyticsController();
