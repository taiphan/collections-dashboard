import { ApplicationStatus, ApplicationChannel, Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { caseService } from '../case-management/case.service.js';
import { generateEntityNumber } from '../../shared/utils/id-generator.js';
import { NotFoundError, ValidationError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'application-service' });

export interface CreateApplicationInput {
  customerId: string;
  productId: string;
  requestedAmount: number;
  requestedTenure: number;
  purpose?: string;
  channel: ApplicationChannel;
  metadata?: Record<string, unknown>;
}

export interface SubmitApplicationInput {
  applicationId: string;
  submittedBy?: string;
}

export interface ApplicationListFilters {
  customerId?: string;
  status?: ApplicationStatus;
  channel?: ApplicationChannel;
  page?: number;
  limit?: number;
}

export class ApplicationService {
  async createApplication(input: CreateApplicationInput): Promise<string> {
    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new NotFoundError('Customer', input.customerId);
    }

    // Validate product exists and is active
    const product = await prisma.loanProduct.findUnique({
      where: { id: input.productId },
    });
    if (!product) {
      throw new NotFoundError('LoanProduct', input.productId);
    }
    if (!product.isActive) {
      throw new BusinessRuleError('Selected loan product is not active');
    }

    // Validate amount within product limits
    const amount = new Prisma.Decimal(input.requestedAmount);
    if (amount.lt(product.minAmount) || amount.gt(product.maxAmount)) {
      throw new ValidationError(
        `Requested amount must be between ${product.minAmount} and ${product.maxAmount}`,
      );
    }

    // Validate tenure within product limits
    if (input.requestedTenure < product.minTenureMonths ||
        input.requestedTenure > product.maxTenureMonths) {
      throw new ValidationError(
        `Tenure must be between ${product.minTenureMonths} and ${product.maxTenureMonths} months`,
      );
    }

    const applicationNumber = generateEntityNumber('application');

    const application = await prisma.application.create({
      data: {
        applicationNumber,
        customerId: input.customerId,
        productId: input.productId,
        requestedAmount: amount,
        requestedTenure: input.requestedTenure,
        purpose: input.purpose,
        channel: input.channel,
        status: 'DRAFT',
        metadata: input.metadata as any,
      },
    });

    log.info(
      { applicationId: application.id, applicationNumber, customerId: input.customerId },
      'Application created',
    );

    return application.id;
  }

  async submitApplication(input: SubmitApplicationInput) {
    const application = await prisma.application.findUnique({
      where: { id: input.applicationId },
      include: { customer: true },
    });

    if (!application) {
      throw new NotFoundError('Application', input.applicationId);
    }

    if (application.status !== 'DRAFT') {
      throw new BusinessRuleError(
        `Application cannot be submitted from status: ${application.status}`,
      );
    }

    // Validate KYC status
    if (application.customer.kycStatus !== 'VERIFIED') {
      throw new BusinessRuleError(
        'Customer KYC must be verified before submitting application',
      );
    }

    // Update application status
    const updated = await prisma.application.update({
      where: { id: input.applicationId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Create a case for processing
    const caseId = await caseService.createCase({
      applicationId: input.applicationId,
    });

    log.info(
      { applicationId: input.applicationId, caseId },
      'Application submitted and case created',
    );

    return { application: updated, caseId };
  }

  async getApplicationById(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        product: true,
        case: true,
        coApplicants: true,
        documents: true,
      },
    });

    if (!application) {
      throw new NotFoundError('Application', applicationId);
    }

    return application;
  }

  async listApplications(filters: ApplicationListFilters) {
    const { page = 1, limit = 20, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ApplicationWhereInput = {};
    if (where.customerId) whereClause.customerId = where.customerId;
    if (where.status) whereClause.status = where.status;
    if (where.channel) whereClause.channel = where.channel;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: whereClause,
        include: {
          customer: { select: { firstName: true, lastName: true } },
          product: { select: { name: true, productType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.application.count({ where: whereClause }),
    ]);

    return {
      data: applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
  ) {
    return prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        completedAt: ['APPROVED', 'REJECTED', 'WITHDRAWN', 'DISBURSED', 'CLOSED']
          .includes(status) ? new Date() : undefined,
      },
    });
  }
}

export const applicationService = new ApplicationService();
