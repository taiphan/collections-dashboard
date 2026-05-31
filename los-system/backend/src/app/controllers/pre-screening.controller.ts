import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { preScreeningService } from '../../domain/pre-screening/pre-screening.service.js';

export const preScreeningSchema = z.object({
  productId: z.string().uuid(),
  applicantData: z.object({
    age: z.number().int().min(18).max(100).optional(),
    monthlyIncome: z.number().positive().optional(),
    employmentStatus: z.enum(['full_time', 'part_time', 'self_employed', 'contract', 'unemployed', 'retired']).optional(),
    existingDebt: z.number().min(0).optional(),
    creditScore: z.number().int().min(300).max(900).optional(),
  }),
  consentForBureauCheck: z.boolean().default(false),
  consentForOpenBanking: z.boolean().default(false),
});

export class PreScreeningController {
  async check(req: Request, res: Response, next: NextFunction) {
    try {
      const input = preScreeningSchema.parse(req.body);
      const result = await preScreeningService.runPreScreening(input);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const result = await preScreeningService.getResult(id);

      if (!result) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Pre-screening result not found or expired' },
        });
        return;
      }

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const preScreeningController = new PreScreeningController();
