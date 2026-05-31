import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { documentService } from '../../domain/document/document.service.js';

export const uploadDocumentSchema = z.object({
  applicationId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  documentType: z.string().min(1).max(100),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  storagePath: z.string().min(1),
  expiresAt: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const verifyDocumentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().max(500).optional(),
});

export class DocumentController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const input = uploadDocumentSchema.parse(req.body);
      const documentId = await documentService.uploadDocument(input);

      res.status(201).json({
        success: true,
        data: { id: documentId },
      });
    } catch (err) {
      next(err);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { status, reason } = verifyDocumentSchema.parse(req.body);

      const updated = await documentService.verifyDocument({
        documentId: id,
        verifiedBy: req.user!.userId,
        status,
        reason,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getByApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params as { applicationId: string };
      const documents = await documentService.getDocumentsByApplication(applicationId);

      res.json({ success: true, data: documents });
    } catch (err) {
      next(err);
    }
  }

  async checklist(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params as { applicationId: string };
      const checklist = await documentService.generateChecklist(applicationId);

      res.json({ success: true, data: checklist });
    } catch (err) {
      next(err);
    }
  }

  async completeness(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params as { applicationId: string };
      const result = await documentService.checkDocumentCompleteness(applicationId);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const documentController = new DocumentController();
