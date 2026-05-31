import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { applicationService } from '../../domain/application/application.service.js';

export const createApplicationSchema = z.object({
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  requestedTenure: z.number().int().positive(),
  purpose: z.string().max(500).optional(),
  channel: z.enum(['WEB', 'MOBILE', 'BRANCH', 'API']),
  metadata: z.record(z.unknown()).optional(),
});

export const listApplicationsSchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.enum([
    'DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'APPROVED',
    'REJECTED', 'WITHDRAWN', 'DISBURSED', 'CLOSED',
  ]).optional(),
  channel: z.enum(['WEB', 'MOBILE', 'BRANCH', 'API']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export class ApplicationController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createApplicationSchema.parse(req.body);
      const applicationId = await applicationService.createApplication(input);

      res.status(201).json({
        success: true,
        data: { id: applicationId },
      });
    } catch (err) {
      next(err);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const result = await applicationService.submitApplication({
        applicationId: id,
        submittedBy: req.user?.userId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const application = await applicationService.getApplicationById(id);

      res.json({
        success: true,
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listApplicationsSchema.parse(req.query);
      const result = await applicationService.listApplications(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const applicationController = new ApplicationController();
