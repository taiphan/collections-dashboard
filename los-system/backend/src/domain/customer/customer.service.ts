import { CustomerType, KycStatus, Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'customer-service' });

export interface CreateCustomerInput {
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  nationalId?: string;
  email?: string;
  phone?: string;
  address?: Record<string, unknown>;
  employmentInfo?: Record<string, unknown>;
  financialInfo?: Record<string, unknown>;
}

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: Record<string, unknown>;
  employmentInfo?: Record<string, unknown>;
  financialInfo?: Record<string, unknown>;
}

export interface CustomerSearchFilters {
  query?: string;
  customerType?: CustomerType;
  kycStatus?: KycStatus;
  page?: number;
  limit?: number;
}

export class CustomerService {
  async createCustomer(input: CreateCustomerInput): Promise<string> {
    // Check for duplicate national ID
    if (input.nationalId) {
      const existing = await prisma.customer.findUnique({
        where: { nationalId: input.nationalId },
      });
      if (existing) {
        throw new ConflictError(
          `Customer with national ID ${input.nationalId} already exists`,
        );
      }
    }

    const customer = await prisma.customer.create({
      data: {
        customerType: input.customerType,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        nationalId: input.nationalId,
        email: input.email,
        phone: input.phone,
        address: input.address as any,
        employmentInfo: input.employmentInfo as any,
        financialInfo: input.financialInfo as any,
        kycStatus: 'PENDING',
      },
    });

    log.info({ customerId: customer.id }, 'Customer created');
    return customer.id;
  }

  async getCustomerById(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            product: { select: { name: true, productType: true } },
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    return customer;
  }

  async updateCustomer(customerId: string, input: UpdateCustomerInput) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    return prisma.customer.update({
      where: { id: customerId },
      data: {
        ...input,
        address: input.address as any,
        employmentInfo: input.employmentInfo as any,
        financialInfo: input.financialInfo as any,
      },
    });
  }

  async searchCustomers(filters: CustomerSearchFilters) {
    const { page = 1, limit = 20, query, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.CustomerWhereInput = {};

    if (query) {
      whereClause.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { nationalId: { contains: query } },
      ];
    }
    if (where.customerType) whereClause.customerType = where.customerType;
    if (where.kycStatus) whereClause.kycStatus = where.kycStatus;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    return {
      data: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateKycStatus(customerId: string, status: KycStatus) {
    return prisma.customer.update({
      where: { id: customerId },
      data: {
        kycStatus: status,
        kycVerifiedAt: status === 'VERIFIED' ? new Date() : undefined,
      },
    });
  }

  async getCustomerRiskProfile(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        applications: {
          where: { status: { in: ['APPROVED', 'DISBURSED'] } },
        },
      },
    });

    if (!customer) throw new NotFoundError('Customer', customerId);

    const financialInfo = customer.financialInfo as Record<string, unknown> | null;

    return {
      customerId,
      riskGrade: customer.riskGrade || 'UNRATED',
      kycStatus: customer.kycStatus,
      totalExposure: customer.applications.reduce(
        (sum, app) => sum + Number(app.requestedAmount),
        0,
      ),
      activeLoans: customer.applications.length,
      monthlyIncome: financialInfo?.monthlyIncome || 0,
    };
  }
}

export const customerService = new CustomerService();
