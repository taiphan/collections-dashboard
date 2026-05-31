import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { disbursementService } from '../../domain/disbursement/disbursement.service.js';

export const initiateDisbursementSchema = z.object({
  caseId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  accountNumber: z.string().min(5).max(34),
});

export class DisbursementController {
  async initiate(req: Request, res: Response, next: NextFunction) {
    try {
      const input = initiateDisbursementSchema.parse(req.body);
      const result = await disbursementService.initiateDisbursement({
        ...input,
        initiatedBy: req.user!.userId,
      });

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const status = await disbursementService.getDisbursementStatus(id);

      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const result = await disbursementService.confirmDisbursement(id, req.user!.userId);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const disbursementController = new DisbursementController();
