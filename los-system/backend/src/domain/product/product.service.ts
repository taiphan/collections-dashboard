import { ProductType, InterestType, Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { cacheGet, cacheSet, cacheDeletePattern } from '../../infrastructure/cache/redis.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'product-service' });
const CACHE_PREFIX = 'los:product';
const CACHE_TTL = 600; // 10 minutes

export interface CreateProductInput {
  code: string;
  name: string;
  description?: string;
  productType: ProductType;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  baseInterestRate: number;
  interestType: InterestType;
  fees?: Record<string, number>;
  eligibilityCriteria?: Record<string, unknown>;
  requiredDocuments?: string[];
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  minTenureMonths?: number;
  maxTenureMonths?: number;
  baseInterestRate?: number;
  fees?: Record<string, number>;
  eligibilityCriteria?: Record<string, unknown>;
  requiredDocuments?: string[];
  isActive?: boolean;
  effectiveTo?: Date;
}

export interface ProductListFilters {
  productType?: ProductType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface AmortizationEntry {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export class ProductService {
  async createProduct(input: CreateProductInput): Promise<string> {
    // Check for duplicate code
    const existing = await prisma.loanProduct.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new ConflictError(`Product with code '${input.code}' already exists`);
    }

    // Validate amount range
    if (input.minAmount >= input.maxAmount) {
      throw new BusinessRuleError('minAmount must be less than maxAmount');
    }

    // Validate tenure range
    if (input.minTenureMonths >= input.maxTenureMonths) {
      throw new BusinessRuleError('minTenureMonths must be less than maxTenureMonths');
    }

    const product = await prisma.loanProduct.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        productType: input.productType,
        minAmount: input.minAmount,
        maxAmount: input.maxAmount,
        minTenureMonths: input.minTenureMonths,
        maxTenureMonths: input.maxTenureMonths,
        baseInterestRate: input.baseInterestRate,
        interestType: input.interestType,
        fees: input.fees as any,
        eligibilityCriteria: input.eligibilityCriteria as any,
        requiredDocuments: input.requiredDocuments as any,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
      },
    });

    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
    log.info({ productId: product.id, code: input.code }, 'Product created');
    return product.id;
  }

  async updateProduct(productId: string, input: UpdateProductInput) {
    const product = await prisma.loanProduct.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundError('LoanProduct', productId);
    }

    const updated = await prisma.loanProduct.update({
      where: { id: productId },
      data: {
        ...input,
        fees: input.fees as any,
        eligibilityCriteria: input.eligibilityCriteria as any,
        requiredDocuments: input.requiredDocuments as any,
      },
    });

    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
    log.info({ productId }, 'Product updated');
    return updated;
  }

  async getProductById(productId: string) {
    const cached = await cacheGet<unknown>(`${CACHE_PREFIX}:${productId}`);
    if (cached) return cached;

    const product = await prisma.loanProduct.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundError('LoanProduct', productId);
    }

    await cacheSet(`${CACHE_PREFIX}:${productId}`, product, CACHE_TTL);
    return product;
  }

  async listProducts(filters: ProductListFilters) {
    const { page = 1, limit = 20, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.LoanProductWhereInput = {};
    if (where.productType) whereClause.productType = where.productType;
    if (where.isActive !== undefined) whereClause.isActive = where.isActive;

    const [products, total] = await Promise.all([
      prisma.loanProduct.findMany({
        where: whereClause,
        orderBy: [{ productType: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.loanProduct.count({ where: whereClause }),
    ]);

    return {
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getActiveProducts(productType?: ProductType) {
    const now = new Date();
    return prisma.loanProduct.findMany({
      where: {
        isActive: true,
        productType,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async checkEligibility(
    productId: string,
    applicantData: Record<string, unknown>,
  ): Promise<{ eligible: boolean; reasons: string[] }> {
    const product = await prisma.loanProduct.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundError('LoanProduct', productId);

    const criteria = product.eligibilityCriteria as Record<string, number> | null;
    if (!criteria) return { eligible: true, reasons: [] };

    const reasons: string[] = [];

    if (criteria.minAge && Number(applicantData.age) < criteria.minAge) {
      reasons.push(`Minimum age requirement: ${criteria.minAge}`);
    }
    if (criteria.maxAge && Number(applicantData.age) > criteria.maxAge) {
      reasons.push(`Maximum age limit: ${criteria.maxAge}`);
    }
    if (criteria.minIncome && Number(applicantData.monthlyIncome) < criteria.minIncome) {
      reasons.push(`Minimum monthly income: ${criteria.minIncome}`);
    }
    if (criteria.minCreditScore && Number(applicantData.creditScore) < criteria.minCreditScore) {
      reasons.push(`Minimum credit score: ${criteria.minCreditScore}`);
    }

    return { eligible: reasons.length === 0, reasons };
  }

  calculateAmortization(
    principal: number,
    annualRate: number,
    tenureMonths: number,
  ): AmortizationEntry[] {
    const monthlyRate = annualRate / 12;
    const payment = principal *
      (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    const schedule: AmortizationEntry[] = [];
    let balance = principal;

    for (let period = 1; period <= tenureMonths; period++) {
      const interest = balance * monthlyRate;
      const principalPayment = payment - interest;
      balance -= principalPayment;

      schedule.push({
        period,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.max(0, Math.round(balance * 100) / 100),
      });
    }

    return schedule;
  }

  calculateMonthlyPayment(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12;
    const payment = principal *
      (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(payment * 100) / 100;
  }
}

export const productService = new ProductService();
