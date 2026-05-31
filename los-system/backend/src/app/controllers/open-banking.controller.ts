import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { openBankingService } from '../../domain/open-banking/open-banking.service.js';

export const connectBankSchema = z.object({
  customerId: z.string().uuid(),
  bankId: z.string().min(1),
});

export class OpenBankingController {
  async connect(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, bankId } = connectBankSchema.parse(req.body);
      const result = await openBankingService.connectBank(customerId, bankId);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params as { customerId: string };
      const accounts = await openBankingService.getAccounts(customerId);

      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params as { customerId: string };
      const months = req.query.months ? parseInt(req.query.months as string) : 3;
      const transactions = await openBankingService.getTransactions(customerId, months);

      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }

  async affordability(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params as { customerId: string };
      const assessment = await openBankingService.calculateAffordability(customerId);

      res.json({ success: true, data: assessment });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = openBankingService.getCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }
}

export const openBankingController = new OpenBankingController();
