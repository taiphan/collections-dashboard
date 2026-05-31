import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { integrationService } from '../../domain/integration/integration.service.js';

export const creditCheckSchema = z.object({
  nationalId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
});

export const kycVerifySchema = z.object({
  nationalId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  documentType: z.enum(['passport', 'national_id', 'drivers_license']),
  documentNumber: z.string().min(1),
});

export const disbursementSchema = z.object({
  applicationId: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  accountNumber: z.string().min(1),
  reference: z.string().min(1),
});

export class IntegrationController {
  async creditCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const input = creditCheckSchema.parse(req.body);
      const report = await integrationService.pullCreditReport(input);

      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async kycVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const input = kycVerifySchema.parse(req.body);
      const result = await integrationService.verifyIdentity(input);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async disburse(req: Request, res: Response, next: NextFunction) {
    try {
      const input = disbursementSchema.parse(req.body);
      const result = await integrationService.disburseFunds(input);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const integrationController = new IntegrationController();
