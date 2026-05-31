import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { esgService } from '../../domain/esg/esg.service.js';

export const esgAssessmentSchema = z.object({
  customerId: z.string().uuid(),
  applicationId: z.string().uuid(),
  loanPurpose: z.string().optional(),
  industry: z.string().optional(),
  propertyType: z.string().optional(),
  vehicleType: z.enum(['electric', 'hybrid', 'petrol', 'diesel']).optional(),
  companySize: z.enum(['micro', 'small', 'medium', 'large']).optional(),
  renewableEnergy: z.boolean().optional(),
  socialImpact: z.boolean().optional(),
  governanceRating: z.number().min(0).max(100).optional(),
});

export class EsgController {
  async calculateScore(req: Request, res: Response, next: NextFunction) {
    try {
      const input = esgAssessmentSchema.parse(req.body);
      const score = await esgService.calculateScore(input);

      res.json({ success: true, data: score });
    } catch (err) {
      next(err);
    }
  }

  async getCriteria(req: Request, res: Response, next: NextFunction) {
    try {
      const criteria = esgService.getCriteria();
      res.json({ success: true, data: criteria });
    } catch (err) {
      next(err);
    }
  }
}

export const esgController = new EsgController();
