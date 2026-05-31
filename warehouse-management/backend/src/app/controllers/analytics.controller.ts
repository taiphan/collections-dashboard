import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { analyticsService } from '../../domain/analytics/analytics.service.js';
import { predictionService } from '../../domain/analytics/prediction.service.js';

const movingAvgSchema = z.object({
  window: z.coerce.number().int().refine((v) => [7, 30, 90].includes(v), {
    message: 'Window must be 7, 30, or 90 days',
  }),
});

const topProductsSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const turnoverSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const trendSchema = z.object({
  days: z.coerce.number().int().min(90).max(365).default(90),
});

const forecastSchema = z.object({
  skuId: z.string().uuid(),
});

const reorderSchema = z.object({
  leadTimeDays: z.coerce.number().int().min(1).max(180).default(14),
});

export class AnalyticsController {
  async getMovingAverages(req: Request, res: Response, next: NextFunction) {
    try {
      const { window } = movingAvgSchema.parse(req.query);
      const result = await analyticsService.getMovingAverages(window);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { days, limit } = topProductsSchema.parse(req.query);
      const result = await analyticsService.getTopProducts(days, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getTurnover(req: Request, res: Response, next: NextFunction) {
    try {
      const { days } = turnoverSchema.parse(req.query);
      const result = await analyticsService.getTurnoverRates(days);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { days } = trendSchema.parse(req.query);
      const result = await analyticsService.getTrends(days);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const { skuId } = forecastSchema.parse(req.params);
      const result = await predictionService.getForecast(skuId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getReorderAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { leadTimeDays } = reorderSchema.parse(req.query);
      const result = await predictionService.getReorderAlerts(leadTimeDays);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
