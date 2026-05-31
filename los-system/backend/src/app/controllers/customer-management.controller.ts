import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { customerManagementService } from '../../domain/customer-management/customer-management.service.js';

const resolveAlertSchema = z.object({
  resolution: z.string().min(1).max(500),
});

const alertFiltersSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.enum(['payment_delay', 'income_drop', 'high_utilization', 'adverse_event', 'behavioral_change']).optional(),
  resolved: z.enum(['true', 'false']).optional(),
});

export class CustomerManagementController {
  async getPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await customerManagementService.getPortfolioMetrics();

      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  async getHealthScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params as { customerId: string };
      const healthScore = await customerManagementService.calculateHealthScore(customerId);

      res.json({ success: true, data: healthScore });
    } catch (err) {
      next(err);
    }
  }

  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = alertFiltersSchema.parse(req.query);
      const alerts = await customerManagementService.getAlerts({
        severity: filters.severity,
        type: filters.type,
        resolved: filters.resolved ? filters.resolved === 'true' : undefined,
      });

      res.json({ success: true, data: alerts });
    } catch (err) {
      next(err);
    }
  }

  async resolveAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const { alertId } = req.params as { alertId: string };
      const { resolution } = resolveAlertSchema.parse(req.body);
      const result = await customerManagementService.resolveAlert(alertId, resolution);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params as { customerId: string };
      const timeline = await customerManagementService.getCustomerTimeline(customerId);

      res.json({ success: true, data: timeline });
    } catch (err) {
      next(err);
    }
  }
}

export const customerManagementController = new CustomerManagementController();
