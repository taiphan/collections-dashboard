import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reportService } from '../../domain/report/report.service.js';

const reportSchema = z.object({
  periodType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const exportSchema = z.object({
  format: z.enum(['csv', 'pdf']),
});

export class ReportController {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const params = reportSchema.parse(req.query);
      const report = await reportService.generate(params);
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const { format } = exportSchema.parse(req.params);
      const params = reportSchema.parse(req.query);
      const report = await reportService.generate(params);

      if (format === 'csv') {
        const csv = reportService.exportCsv(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=report-${params.periodType}.csv`);
        res.send(csv);
      } else {
        // PDF placeholder — would use pdfkit in production
        res.json({
          success: false,
          error: { code: 'NOT_IMPLEMENTED', message: 'PDF export coming soon' },
        });
      }
    } catch (err) {
      next(err);
    }
  }
}

export const reportController = new ReportController();
