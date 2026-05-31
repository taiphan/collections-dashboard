import { DocumentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError, ValidationError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'document-service' });

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadDocumentInput {
  applicationId?: string;
  customerId?: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface DocumentChecklistItem {
  documentType: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  status?: DocumentStatus;
  documentId?: string;
}

export interface VerifyDocumentInput {
  documentId: string;
  verifiedBy: string;
  status: 'VERIFIED' | 'REJECTED';
  reason?: string;
}

export class DocumentService {
  async uploadDocument(input: UploadDocumentInput): Promise<string> {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
      throw new ValidationError(
        `File type '${input.mimeType}' is not allowed. Accepted: PDF, JPEG, PNG, WEBP, DOC, DOCX`,
      );
    }

    // Validate file size
    if (input.fileSize > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File size ${(input.fileSize / 1024 / 1024).toFixed(1)}MB exceeds maximum of 10MB`,
      );
    }

    // Validate that either applicationId or customerId is provided
    if (!input.applicationId && !input.customerId) {
      throw new ValidationError('Either applicationId or customerId must be provided');
    }

    const document = await prisma.document.create({
      data: {
        applicationId: input.applicationId,
        customerId: input.customerId,
        documentType: input.documentType,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        storagePath: input.storagePath,
        status: 'UPLOADED',
        expiresAt: input.expiresAt,
        metadata: input.metadata as any,
      },
    });

    // Log activity on the case if application-linked
    if (input.applicationId) {
      const appCase = await prisma.case.findUnique({
        where: { applicationId: input.applicationId },
      });
      if (appCase) {
        await prisma.caseActivity.create({
          data: {
            caseId: appCase.id,
            activityType: 'DOCUMENT_UPLOAD',
            description: `Document uploaded: ${input.documentType} (${input.fileName})`,
          },
        });
      }
    }

    log.info({ documentId: document.id, type: input.documentType }, 'Document uploaded');
    return document.id;
  }

  async verifyDocument(input: VerifyDocumentInput) {
    const document = await prisma.document.findUnique({
      where: { id: input.documentId },
    });

    if (!document) {
      throw new NotFoundError('Document', input.documentId);
    }

    if (document.status === 'VERIFIED') {
      throw new BusinessRuleError('Document is already verified');
    }

    const updated = await prisma.document.update({
      where: { id: input.documentId },
      data: {
        status: input.status,
        verifiedBy: input.verifiedBy,
        verifiedAt: new Date(),
        metadata: {
          ...(document.metadata as Record<string, unknown> || {}),
          verificationReason: input.reason,
        } as any,
      },
    });

    log.info(
      { documentId: input.documentId, status: input.status },
      'Document verification updated',
    );

    return updated;
  }

  async getDocumentsByApplication(applicationId: string) {
    return prisma.document.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentsByCustomer(customerId: string) {
    return prisma.document.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateChecklist(applicationId: string): Promise<DocumentChecklistItem[]> {
    // Get application with product to determine required documents
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { product: true },
    });

    if (!application) {
      throw new NotFoundError('Application', applicationId);
    }

    const requiredDocs = (application.product.requiredDocuments as string[]) || [];
    const uploadedDocs = await prisma.document.findMany({
      where: { applicationId },
    });

    const DOCUMENT_LABELS: Record<string, string> = {
      government_id: 'Government-issued ID',
      proof_of_income: 'Proof of Income',
      bank_statements_3m: 'Bank Statements (3 months)',
      bank_statements_6m: 'Bank Statements (6 months)',
      proof_of_address: 'Proof of Address',
      vehicle_invoice: 'Vehicle Invoice/Purchase Agreement',
      insurance_quote: 'Insurance Quote',
      tax_returns_2y: 'Tax Returns (2 years)',
      property_appraisal: 'Property Appraisal Report',
      title_report: 'Title Report',
      insurance_binder: 'Insurance Binder',
    };

    return requiredDocs.map((docType) => {
      const uploaded = uploadedDocs.find((d) => d.documentType === docType);
      return {
        documentType: docType,
        label: DOCUMENT_LABELS[docType] || docType,
        required: true,
        uploaded: !!uploaded,
        status: uploaded?.status,
        documentId: uploaded?.id,
      };
    });
  }

  async checkDocumentCompleteness(applicationId: string): Promise<{
    complete: boolean;
    total: number;
    uploaded: number;
    verified: number;
    missing: string[];
  }> {
    const checklist = await this.generateChecklist(applicationId);
    const total = checklist.filter((item) => item.required).length;
    const uploaded = checklist.filter((item) => item.uploaded).length;
    const verified = checklist.filter((item) => item.status === 'VERIFIED').length;
    const missing = checklist
      .filter((item) => item.required && !item.uploaded)
      .map((item) => item.label);

    return {
      complete: missing.length === 0,
      total,
      uploaded,
      verified,
      missing,
    };
  }

  async getExpiredDocuments() {
    return prisma.document.findMany({
      where: {
        expiresAt: { lte: new Date() },
        status: { not: 'EXPIRED' },
      },
      include: {
        application: { select: { applicationNumber: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async markExpiredDocuments(): Promise<number> {
    const result = await prisma.document.updateMany({
      where: {
        expiresAt: { lte: new Date() },
        status: { not: 'EXPIRED' },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      log.info({ count: result.count }, 'Documents marked as expired');
    }

    return result.count;
  }
}

export const documentService = new DocumentService();
