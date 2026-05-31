import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { digitalOnboardingService } from '../../domain/digital-onboarding/digital-onboarding.service.js';

const startOnboardingSchema = z.object({
  channel: z.enum(['web', 'mobile', 'branch', 'api']),
});

const verifyIdentitySchema = z.object({
  documentType: z.string().min(1).max(50),
  documentNumber: z.string().min(1).max(50),
  fullName: z.string().min(1).max(200),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export class DigitalOnboardingController {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const { channel } = startOnboardingSchema.parse(req.body);
      const session = await digitalOnboardingService.startOnboarding(channel);

      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params as { sessionId: string };
      const session = await digitalOnboardingService.getSession(sessionId);

      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async verifyIdentity(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params as { sessionId: string };
      const documentData = verifyIdentitySchema.parse(req.body);
      const result = await digitalOnboardingService.verifyIdentity(sessionId, documentData);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async biometric(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params as { sessionId: string };
      const result = await digitalOnboardingService.performBiometric(sessionId);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params as { sessionId: string };
      const session = await digitalOnboardingService.completeOnboarding(sessionId);

      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }
}

export const digitalOnboardingController = new DigitalOnboardingController();
