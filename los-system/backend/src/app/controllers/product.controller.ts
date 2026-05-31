import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { productService } from '../../domain/product/product.service.js';

export const createProductSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  productType: z.enum(['PERSONAL', 'MORTGAGE', 'AUTO', 'SME', 'COMMERCIAL', 'CREDIT_LINE']),
  minAmount: z.number().positive(),
  maxAmount: z.number().positive(),
  minTenureMonths: z.number().int().positive(),
  maxTenureMonths: z.number().int().positive(),
  baseInterestRate: z.number().min(0).max(1),
  interestType: z.enum(['FIXED', 'VARIABLE', 'HYBRID']),
  fees: z.record(z.number()).optional(),
  eligibilityCriteria: z.record(z.unknown()).optional(),
  requiredDocuments: z.array(z.string()).optional(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  minTenureMonths: z.number().int().positive().optional(),
  maxTenureMonths: z.number().int().positive().optional(),
  baseInterestRate: z.number().min(0).max(1).optional(),
  fees: z.record(z.number()).optional(),
  eligibilityCriteria: z.record(z.unknown()).optional(),
  requiredDocuments: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  effectiveTo: z.coerce.date().optional(),
});

export const listProductsSchema = z.object({
  productType: z.enum(['PERSONAL', 'MORTGAGE', 'AUTO', 'SME', 'COMMERCIAL', 'CREDIT_LINE']).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const amortizationSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  tenureMonths: z.number().int().positive().max(600),
});

export class ProductController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createProductSchema.parse(req.body);
      const productId = await productService.createProduct(input);

      res.status(201).json({ success: true, data: { id: productId } });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const input = updateProductSchema.parse(req.body);
      const updated = await productService.updateProduct(id, input);

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const product = await productService.getProductById(id);

      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listProductsSchema.parse(req.query);
      const result = await productService.listProducts(filters);

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const productType = req.query.productType as string | undefined;
      const products = await productService.getActiveProducts(
        productType as 'PERSONAL' | 'MORTGAGE' | 'AUTO' | 'SME' | 'COMMERCIAL' | 'CREDIT_LINE' | undefined,
      );

      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const applicantData = req.body;
      const result = await productService.checkEligibility(id, applicantData);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async amortization(req: Request, res: Response, next: NextFunction) {
    try {
      const { principal, annualRate, tenureMonths } = amortizationSchema.parse(req.body);
      const schedule = productService.calculateAmortization(principal, annualRate, tenureMonths);
      const monthlyPayment = productService.calculateMonthlyPayment(principal, annualRate, tenureMonths);
      const totalPayment = monthlyPayment * tenureMonths;
      const totalInterest = totalPayment - principal;

      res.json({
        success: true,
        data: {
          monthlyPayment,
          totalPayment: Math.round(totalPayment * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
          schedule,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
