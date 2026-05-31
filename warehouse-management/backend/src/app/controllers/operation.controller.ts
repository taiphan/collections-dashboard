import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { operationService } from '../../domain/operation/operation.service.js';
import { paginationSchema } from '../../shared/utils/pagination.js';

const lineItemSchema = z.object({
  skuId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999999),
  unitCost: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
});

const createImportSchema = z.object({
  supplierRef: z.string().max(100).optional(),
  expectedDate: z.coerce.date().optional(),
  lineItems: z.array(lineItemSchema).min(1).max(500),
});

const createExportSchema = z.object({
  destination: z.string().min(1).max(255),
  reason: z.enum(['SALE', 'TRANSFER', 'RETURN']),
  lineItems: z.array(lineItemSchema).min(1).max(200),
});

const rejectSchema = z.object({
  reason: z.string().min(10).max(500),
});

const listSchema = paginationSchema.extend({
  type: z.enum(['IMPORT', 'EXPORT']).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
});

export class OperationController {
  async createImport(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createImportSchema.parse(req.body);
      const operation = await operationService.createImport(input, req.user!.userId);
      res.status(201).json({ success: true, data: operation });
    } catch (err) {
      next(err);
    }
  }

  async createExport(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createExportSchema.parse(req.body);
      const operation = await operationService.createExport(input, req.user!.userId);
      res.status(201).json({ success: true, data: operation });
    } catch (err) {
      next(err);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const operation = await operationService.submit(id, req.user!.userId);
      res.json({ success: true, data: operation });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const operation = await operationService.approve(id, req.user!.userId);
      res.json({ success: true, data: operation });
    } catch (err) {
      next(err);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { reason } = rejectSchema.parse(req.body);
      const operation = await operationService.reject(id, req.user!.userId, reason);
      res.json({ success: true, data: operation });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const operation = await operationService.cancel(id, req.user!.userId);
      res.json({ success: true, data: operation });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const operation = await operationService.findById(id);
      res.json({ success: true, data: operation });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const params = listSchema.parse(req.query);
      const result = await operationService.findAll(params);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getStatusLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const logs = await operationService.getStatusLog(id);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}

export const operationController = new OperationController();
