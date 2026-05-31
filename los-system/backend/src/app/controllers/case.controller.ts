import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { caseService } from '../../domain/case-management/case.service.js';

export const listCasesSchema = z.object({
  stage: z.enum([
    'INTAKE', 'VERIFICATION', 'UNDERWRITING',
    'APPROVAL', 'DOCUMENTATION', 'DISBURSEMENT', 'CLOSED',
  ]).optional(),
  status: z.enum([
    'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'ESCALATED', 'COMPLETED', 'CANCELLED',
  ]).optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  slaBreached: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const transitionStageSchema = z.object({
  toStage: z.enum([
    'INTAKE', 'VERIFICATION', 'UNDERWRITING',
    'APPROVAL', 'DOCUMENTATION', 'DISBURSEMENT', 'CLOSED',
  ]),
  reason: z.string().max(500).optional(),
});

export const assignCaseSchema = z.object({
  userId: z.string().uuid(),
});

export const updatePrioritySchema = z.object({
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
});

export class CaseController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const caseData = await caseService.getCaseById(id);

      res.json({
        success: true,
        data: caseData,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listCasesSchema.parse(req.query);
      const result = await caseService.listCases(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async transitionStage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { toStage, reason } = transitionStageSchema.parse(req.body);

      const updated = await caseService.transitionStage({
        caseId: id,
        toStage,
        changedBy: req.user!.userId,
        reason,
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { userId } = assignCaseSchema.parse(req.body);

      const updated = await caseService.assignCase(id, userId, req.user!.userId);

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePriority(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { priority } = updatePrioritySchema.parse(req.body);

      const updated = await caseService.updatePriority(id, priority, req.user!.userId);

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.userId as string | undefined;
      const stats = await caseService.getDashboardStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const caseController = new CaseController();
