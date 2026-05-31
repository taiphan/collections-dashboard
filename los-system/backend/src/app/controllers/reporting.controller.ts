import { Request, Response, NextFunction } from 'express';
import { reportingService } from '../../domain/reporting/reporting.service.js';

export class ReportingController {
  async pipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportingService.getPipelineReport();
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async tat(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportingService.getTatReport();
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async officerPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportingService.getOfficerPerformance();
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async portfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportingService.getPortfolioSummary();
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
}

export const reportingController = new ReportingController();
