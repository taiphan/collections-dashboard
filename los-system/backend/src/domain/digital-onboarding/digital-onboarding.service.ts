import { prisma } from '../../infrastructure/database/prisma.js';
import { cacheGet, cacheSet } from '../../infrastructure/cache/redis.js';
import { NotFoundError, ValidationError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'digital-onboarding' });
const SESSION_TTL = 24 * 3600; // 24 hours

// Types
export interface OnboardingSession {
  id: string;
  customerId?: string;
  channel: string;
  status: 'started' | 'identity_verification' | 'document_upload' | 'biometric' | 'signature' | 'completed' | 'failed';
  steps: OnboardingStep[];
  createdAt: Date;
  completedAt?: Date;
}

export interface OnboardingStep {
  id: string;
  type: 'identity' | 'document' | 'biometric' | 'signature' | 'aml_check';
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped';
  result?: Record<string, unknown>;
  completedAt?: Date;
}

export interface BiometricResult {
  faceMatchScore: number;
  livenessScore: number;
  passed: boolean;
  antiSpoofingPassed: boolean;
}

export interface DocumentVerificationResult {
  documentType: string;
  isAuthentic: boolean;
  tamperingDetected: boolean;
  extractedData: Record<string, string>;
  confidenceScore: number;
}

const CHANNEL_STEPS: Record<string, OnboardingStep['type'][]> = {
  web: ['identity', 'document', 'biometric', 'aml_check', 'signature'],
  mobile: ['identity', 'document', 'biometric', 'aml_check', 'signature'],
  branch: ['identity', 'document', 'aml_check', 'signature'],
  api: ['identity', 'document', 'aml_check'],
};

export class DigitalOnboardingService {
  async startOnboarding(channel: string): Promise<OnboardingSession> {
    const validChannels = Object.keys(CHANNEL_STEPS);
    if (!validChannels.includes(channel)) {
      throw new ValidationError(
        `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
      );
    }

    const stepTypes = CHANNEL_STEPS[channel];
    const steps: OnboardingStep[] = stepTypes.map((type) => ({
      id: crypto.randomUUID(),
      type,
      status: 'pending',
    }));

    const session: OnboardingSession = {
      id: crypto.randomUUID(),
      channel,
      status: 'started',
      steps,
      createdAt: new Date(),
    };

    await cacheSet(`los:onboarding:${session.id}`, session, SESSION_TTL);

    log.info({ sessionId: session.id, channel, stepCount: steps.length }, 'Onboarding session started');

    return session;
  }

  async verifyIdentity(
    sessionId: string,
    documentData: { documentType: string; documentNumber: string; fullName: string; dateOfBirth: string },
  ): Promise<DocumentVerificationResult> {
    const session = await this.getSession(sessionId);

    const identityStep = session.steps.find((s) => s.type === 'identity');
    if (!identityStep) {
      throw new BusinessRuleError('Identity step not found in this session');
    }

    // Simulate document verification
    const confidenceScore = 75 + Math.random() * 25; // 75-100
    const isAuthentic = confidenceScore > 80;
    const tamperingDetected = Math.random() < 0.05; // 5% chance

    const result: DocumentVerificationResult = {
      documentType: documentData.documentType,
      isAuthentic,
      tamperingDetected,
      extractedData: {
        fullName: documentData.fullName,
        dateOfBirth: documentData.dateOfBirth,
        documentNumber: documentData.documentNumber,
        expiryDate: '2028-12-31',
        issuingCountry: 'US',
      },
      confidenceScore: Math.round(confidenceScore * 100) / 100,
    };

    identityStep.status = isAuthentic && !tamperingDetected ? 'passed' : 'failed';
    identityStep.result = result as unknown as Record<string, unknown>;
    identityStep.completedAt = new Date();

    session.status = 'identity_verification';
    await cacheSet(`los:onboarding:${sessionId}`, session, SESSION_TTL);

    log.info(
      { sessionId, isAuthentic, confidenceScore: result.confidenceScore },
      'Identity verification completed',
    );

    return result;
  }

  async performBiometric(sessionId: string): Promise<BiometricResult> {
    const session = await this.getSession(sessionId);

    const biometricStep = session.steps.find((s) => s.type === 'biometric');
    if (!biometricStep) {
      throw new BusinessRuleError('Biometric step not available for this channel');
    }

    // Simulate biometric verification
    const faceMatchScore = 70 + Math.random() * 30; // 70-100
    const livenessScore = 75 + Math.random() * 25; // 75-100
    const antiSpoofingPassed = Math.random() > 0.03; // 97% pass rate
    const passed = faceMatchScore >= 80 && livenessScore >= 85 && antiSpoofingPassed;

    const result: BiometricResult = {
      faceMatchScore: Math.round(faceMatchScore * 100) / 100,
      livenessScore: Math.round(livenessScore * 100) / 100,
      passed,
      antiSpoofingPassed,
    };

    biometricStep.status = passed ? 'passed' : 'failed';
    biometricStep.result = result as unknown as Record<string, unknown>;
    biometricStep.completedAt = new Date();

    session.status = 'biometric';
    await cacheSet(`los:onboarding:${sessionId}`, session, SESSION_TTL);

    log.info(
      { sessionId, passed, faceMatchScore: result.faceMatchScore },
      'Biometric verification completed',
    );

    return result;
  }

  async checkAntiTampering(
    sessionId: string,
    documentId: string,
  ): Promise<{ passed: boolean; deepfakeScore: number; syntheticScore: number }> {
    const session = await this.getSession(sessionId);

    const documentStep = session.steps.find((s) => s.type === 'document');
    if (!documentStep) {
      throw new BusinessRuleError('Document step not found in this session');
    }

    // Simulate deepfake/synthetic detection
    const deepfakeScore = Math.random() * 15; // 0-15 (low = good)
    const syntheticScore = Math.random() * 10; // 0-10 (low = good)
    const passed = deepfakeScore < 30 && syntheticScore < 25;

    documentStep.status = passed ? 'passed' : 'failed';
    documentStep.result = { documentId, deepfakeScore, syntheticScore, passed };
    documentStep.completedAt = new Date();

    session.status = 'document_upload';
    await cacheSet(`los:onboarding:${sessionId}`, session, SESSION_TTL);

    log.info(
      { sessionId, documentId, passed, deepfakeScore, syntheticScore },
      'Anti-tampering check completed',
    );

    return {
      passed,
      deepfakeScore: Math.round(deepfakeScore * 100) / 100,
      syntheticScore: Math.round(syntheticScore * 100) / 100,
    };
  }

  async completeOnboarding(sessionId: string): Promise<OnboardingSession> {
    const session = await this.getSession(sessionId);

    const failedSteps = session.steps.filter(
      (s) => s.status === 'failed' && s.type !== 'signature',
    );

    if (failedSteps.length > 0) {
      session.status = 'failed';
      await cacheSet(`los:onboarding:${sessionId}`, session, SESSION_TTL);
      throw new BusinessRuleError(
        `Cannot complete onboarding: ${failedSteps.length} step(s) failed`,
        { failedSteps: failedSteps.map((s) => s.type) },
      );
    }

    // Mark remaining pending steps as skipped
    session.steps.forEach((step) => {
      if (step.status === 'pending') {
        step.status = 'skipped';
      }
    });

    // Mark signature step as passed (simulated e-signature)
    const signatureStep = session.steps.find((s) => s.type === 'signature');
    if (signatureStep && signatureStep.status !== 'passed') {
      signatureStep.status = 'passed';
      signatureStep.completedAt = new Date();
      signatureStep.result = { signatureMethod: 'electronic', timestamp: new Date().toISOString() };
    }

    session.status = 'completed';
    session.completedAt = new Date();

    // Create customer record
    const customer = await prisma.customer.create({
      data: {
        customerType: 'INDIVIDUAL',
        firstName: 'Onboarded',
        lastName: `Customer-${sessionId.slice(0, 8)}`,
        email: `customer-${sessionId.slice(0, 8)}@example.com`,
        phone: '+1000000000',
        dateOfBirth: new Date('1990-01-01'),
        kycStatus: 'VERIFIED',
      },
    });

    session.customerId = customer.id;
    await cacheSet(`los:onboarding:${sessionId}`, session, SESSION_TTL);

    log.info(
      { sessionId, customerId: customer.id },
      'Onboarding completed, customer created',
    );

    return session;
  }

  async getSession(sessionId: string): Promise<OnboardingSession> {
    const session = await cacheGet<OnboardingSession>(`los:onboarding:${sessionId}`);
    if (!session) {
      throw new NotFoundError('OnboardingSession', sessionId);
    }
    return session;
  }
}

export const digitalOnboardingService = new DigitalOnboardingService();
