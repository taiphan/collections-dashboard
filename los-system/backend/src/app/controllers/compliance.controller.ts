import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { complianceService } from '../../domain/compliance/compliance.service.js';

export const complianceScreeningSchema = z.object({
  caseId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string().min(1).max(200),
  nationalId: z.string().min(1).max(50),
  dateOfBirth: z.string().optional(),
  country: z.string().max(3).optional(),
});

export class ComplianceController {
  async screen(req: Request, res: Response, next: NextFunction) {
    try {
      const input = complianceScreeningSchema.parse(req.body);
      const result = await complianceService.runFullScreening({
        ...input,
        screenedBy: req.user!.userId,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAuditTrail(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params as { caseId: string };
      const trail = await complianceService.getAuditTrail(caseId);

      res.json({ success: true, data: trail });
    } catch (err) {
      next(err);
    }
  }
}

export const complianceController = new ComplianceController();
