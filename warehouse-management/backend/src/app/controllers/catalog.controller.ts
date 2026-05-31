import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { catalogService } from '../../domain/catalog/catalog.service.js';
import { paginationSchema } from '../../shared/utils/pagination.js';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50),
  unitOfMeasure: z.string().min(1).max(30),
  imageUrl: z.string().url().max(2048).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50).optional(),
  unitOfMeasure: z.string().min(1).max(30).optional(),
  imageUrl: z.string().url().max(2048).optional(),
});

const listSchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
});

export class CatalogController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSchema.parse(req.body);
      const item = await catalogService.create(input, req.user!.userId);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const input = updateSchema.parse(req.body);
      const item = await catalogService.update(id, input, req.user!.userId);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      await catalogService.delete(id, req.user!.userId);
      res.json({ success: true, message: 'Catalog item deleted' });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const item = await catalogService.findById(id);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const params = listSchema.parse(req.query);
      const result = await catalogService.findAll(params);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

export const catalogController = new CatalogController();
