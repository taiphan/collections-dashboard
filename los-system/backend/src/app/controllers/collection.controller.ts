import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { collectionService } from '../../domain/collection/collection.service.js';

const createCaseSchema = z.object({
  customerId: z.string().min(1),
  loanId: z.string().min(1),
  overdueAmount: z.number().positive(),
  daysOverdue: z.number().int().positive(),
});

const recordContactSchema = z.object({
  channel: z.enum(['sms', 'email', 'call', 'letter']),
  outcome: z.enum(['reached', 'no_answer', 'promise_to_pay', 'refused', 'wrong_number']),
});

const createArrangementSchema = z.object({
  totalAmount: z.number().positive(),
  installments: z.number().int().min(1).max(60),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const listCasesSchema = z.object({
  status: z.enum(['new', 'contacted', 'promise_to_pay', 'arrangement', 'escalated', 'legal', 'recovered', 'written_off']).optional(),
  strategy: z.enum(['soft', 'medium', 'hard', 'legal']).optional(),
  assignedTo: z.string().optional(),
  minDaysOverdue: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class CollectionController {
  async createCase(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createCaseSchema.parse(req.body);
      const result = await collectionService.createCollectionCase(
        input.customerId,
        input.loanId,
        input.overdueAmount,
        input.daysOverdue,
      );

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listCases(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listCasesSchema.parse(req.query);
      const result = await collectionService.listCases(filters);

      res.json({ success: true, data: result.cases, meta: { total: result.total } });
    } catch (err) {
      next(err);
    }
  }

  async getCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const prediction = await collectionService.predictSelfCure(id);

      res.json({ success: true, data: prediction });
    } catch (err) {
      next(err);
    }
  }

  async recordContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { channel, outcome } = recordContactSchema.parse(req.body);
      const result = await collectionService.recordContact(id, channel, outcome);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createArrangement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const plan = createArrangementSchema.parse(req.body);
      const result = await collectionService.createArrangement(id, plan);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await collectionService.getRecoveryMetrics();

      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }
}

export const collectionController = new CollectionController();
