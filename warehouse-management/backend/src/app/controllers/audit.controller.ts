import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auditService } from '../../domain/audit/audit.service.js';
import { paginationSchema } from '../../shared/utils/pagination.js';

const querySchema = paginationSchema.extend({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
  operationType: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export class AuditController {
  async query(req: Request, res: Response, next: NextFunction) {
    try {
      const params = querySchema.parse(req.query);
      const result = await auditService.query(params);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();
