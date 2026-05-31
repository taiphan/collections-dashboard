import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { inventoryService } from '../../domain/inventory/inventory.service.js';
import { paginationSchema } from '../../shared/utils/pagination.js';

const listSchema = paginationSchema.extend({
  category: z.string().optional(),
  skuCode: z.string().optional(),
  location: z.string().optional(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
});

const thresholdSchema = z.object({
  threshold: z.number().int().min(1).max(10000),
});

export class InventoryController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const params = listSchema.parse(req.query);
      const result = await inventoryService.findAll(params);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getBySkuId(req: Request, res: Response, next: NextFunction) {
    try {
      const { skuId } = req.params as { skuId: string };
      const record = await inventoryService.findBySkuId(skuId);
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }

  async updateThreshold(req: Request, res: Response, next: NextFunction) {
    try {
      const { skuId } = req.params as { skuId: string };
      const { threshold } = thresholdSchema.parse(req.body);
      const record = await inventoryService.updateThreshold(skuId, threshold);
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
