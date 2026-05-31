import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { customerService } from '../../domain/customer/customer.service.js';

export const createCustomerSchema = z.object({
  customerType: z.enum(['INDIVIDUAL', 'CORPORATE']),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date().optional(),
  nationalId: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  employmentInfo: z.object({
    employer: z.string().optional(),
    position: z.string().optional(),
    monthlyIncome: z.number().positive().optional(),
    yearsEmployed: z.number().min(0).optional(),
  }).optional(),
  financialInfo: z.object({
    monthlyIncome: z.number().positive().optional(),
    monthlyExpenses: z.number().min(0).optional(),
    existingDebt: z.number().min(0).optional(),
    assets: z.number().min(0).optional(),
  }).optional(),
});

export const searchCustomersSchema = z.object({
  query: z.string().optional(),
  customerType: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  kycStatus: z.enum(['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateKycSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED']),
});

export class CustomerController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createCustomerSchema.parse(req.body);
      const customerId = await customerService.createCustomer(input);

      res.status(201).json({
        success: true,
        data: { id: customerId },
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const customer = await customerService.getCustomerById(id);

      res.json({
        success: true,
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = searchCustomersSchema.parse(req.query);
      const result = await customerService.searchCustomers(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateKyc(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { status } = updateKycSchema.parse(req.body);

      const updated = await customerService.updateKycStatus(id, status);

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async riskProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const profile = await customerService.getCustomerRiskProfile(id);

      res.json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const customerController = new CustomerController();
