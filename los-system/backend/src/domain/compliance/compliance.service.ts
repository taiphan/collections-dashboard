import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'compliance-service' });

// ============================================================
// Types
// ============================================================

export interface ComplianceScreeningInput {
  caseId: string;
  customerId: string;
  customerName: string;
  nationalId: string;
  dateOfBirth?: string;
  country?: string;
  screenedBy: string;
}

export interface ComplianceCheckResult {
  passed: boolean;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  checks: {
    aml: AmlCheckResult;
    sanctions: SanctionsCheckResult;
    kyc: KycStatusResult;
  };
  flags: string[];
  recommendations: string[];
  screenedAt: string;
}

export interface AmlCheckResult {
  passed: boolean;
  riskScore: number;
  matchedPatterns: string[];
  details: string;
}

export interface SanctionsCheckResult {
  passed: boolean;
  ofacMatch: boolean;
  pepMatch: boolean;
  matchedEntries: string[];
  details: string;
}

export interface KycStatusResult {
  verified: boolean;
  documentStatus: 'VALID' | 'EXPIRED' | 'PENDING' | 'REJECTED';
  lastVerifiedAt: string | null;
}

export interface ComplianceAuditEntry {
  id: string;
  caseId: string;
  action: string;
  result: string;
  details: Record<string, unknown>;
  performedBy: string;
  performedAt: string;
}

// ============================================================
// Simulated AML/Sanctions Data
// ============================================================

const AML_FLAGGED_PATTERNS = [
  'structuring',
  'smurfing',
  'layering',
  'shell company',
  'high-risk jurisdiction',
  'unusual transaction pattern',
  'cash-intensive business',
  'politically exposed',
];

const SANCTIONED_NAMES = [
  'JOHN SANCTIONED',
  'JANE BLOCKED',
  'TEST OFAC MATCH',
  'SANCTIONED ENTITY LTD',
];

const PEP_NAMES = [
  'POLITICAL FIGURE',
  'GOVERNMENT OFFICIAL',
  'STATE MINISTER',
];

const HIGH_RISK_COUNTRIES = [
  'NK', 'IR', 'SY', 'CU', 'VE', 'MM', 'BY', 'RU',
];

// ============================================================
// Compliance Service
// ============================================================

export class ComplianceService {
  /**
   * Run full compliance screening: AML + Sanctions + KYC status
   */
  async runFullScreening(input: ComplianceScreeningInput): Promise<ComplianceCheckResult> {
    log.info({ caseId: input.caseId, customerId: input.customerId }, 'Running compliance screening');

    const [aml, sanctions, kyc] = await Promise.all([
      this.runAmlCheck(input),
      this.runSanctionsCheck(input),
      this.checkKycStatus(input.customerId),
    ]);

    const flags: string[] = [
      ...aml.matchedPatterns,
      ...(sanctions.ofacMatch ? ['OFAC_MATCH'] : []),
      ...(sanctions.pepMatch ? ['PEP_MATCH'] : []),
      ...(!kyc.verified ? ['KYC_NOT_VERIFIED'] : []),
      ...(kyc.documentStatus === 'EXPIRED' ? ['KYC_DOCUMENT_EXPIRED'] : []),
    ];

    const overallRisk = this.calculateOverallRisk(aml, sanctions, kyc);
    const passed = overallRisk !== 'CRITICAL' && aml.passed && sanctions.passed && kyc.verified;
    const recommendations = this.generateRecommendations(aml, sanctions, kyc, overallRisk);

    const result: ComplianceCheckResult = {
      passed,
      overallRisk,
      checks: { aml, sanctions, kyc },
      flags,
      recommendations,
      screenedAt: new Date().toISOString(),
    };

    // Append to audit trail
    await this.appendAuditEntry({
      caseId: input.caseId,
      action: 'FULL_SCREENING',
      result: passed ? 'PASS' : 'FAIL',
      details: {
        overallRisk,
        flags,
        amlPassed: aml.passed,
        sanctionsPassed: sanctions.passed,
        kycVerified: kyc.verified,
      },
      performedBy: input.screenedBy,
    });

    log.info(
      { caseId: input.caseId, passed, overallRisk, flagCount: flags.length },
      'Compliance screening completed',
    );

    return result;
  }

  /**
   * AML screening — check against flagged patterns
   */
  private async runAmlCheck(input: ComplianceScreeningInput): Promise<AmlCheckResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    const matchedPatterns: string[] = [];
    const nameLower = input.customerName.toLowerCase();

    // Check for high-risk country
    if (input.country && HIGH_RISK_COUNTRIES.includes(input.country.toUpperCase())) {
      matchedPatterns.push('high-risk jurisdiction');
    }

    // Simulate pattern matching based on name heuristics
    if (nameLower.includes('cash') || nameLower.includes('exchange')) {
      matchedPatterns.push('cash-intensive business');
    }

    const riskScore = matchedPatterns.length * 25;
    const passed = riskScore < 75;

    return {
      passed,
      riskScore: Math.min(riskScore, 100),
      matchedPatterns,
      details: passed
        ? 'No significant AML concerns identified'
        : `AML risk detected: ${matchedPatterns.join(', ')}`,
    };
  }

  /**
   * Sanctions check — OFAC/PEP simulated screening
   */
  private async runSanctionsCheck(input: ComplianceScreeningInput): Promise<SanctionsCheckResult> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const nameUpper = input.customerName.toUpperCase();
    const matchedEntries: string[] = [];

    // OFAC check
    const ofacMatch = SANCTIONED_NAMES.some((name) => {
      if (nameUpper.includes(name) || name.includes(nameUpper)) {
        matchedEntries.push(`OFAC: ${name}`);
        return true;
      }
      return false;
    });

    // PEP check
    const pepMatch = PEP_NAMES.some((name) => {
      if (nameUpper.includes(name) || name.includes(nameUpper)) {
        matchedEntries.push(`PEP: ${name}`);
        return true;
      }
      return false;
    });

    const passed = !ofacMatch && !pepMatch;

    return {
      passed,
      ofacMatch,
      pepMatch,
      matchedEntries,
      details: passed
        ? 'No sanctions or PEP matches found'
        : `Matches found: ${matchedEntries.join('; ')}`,
    };
  }

  /**
   * KYC validation status check
   */
  private async checkKycStatus(customerId: string): Promise<KycStatusResult> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { kycStatus: true, kycVerifiedAt: true },
    });

    if (!customer) {
      return {
        verified: false,
        documentStatus: 'PENDING',
        lastVerifiedAt: null,
      };
    }

    const verified = customer.kycStatus === 'VERIFIED';
    let documentStatus: KycStatusResult['documentStatus'] = 'PENDING';

    if (customer.kycStatus === 'VERIFIED') {
      // Check if verification is older than 12 months
      const verifiedAt = customer.kycVerifiedAt;
      if (verifiedAt) {
        const monthsSinceVerification =
          (Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
        documentStatus = monthsSinceVerification > 1 ? 'EXPIRED' : 'VALID';
      } else {
        documentStatus = 'VALID';
      }
    } else if (customer.kycStatus === 'REJECTED') {
      documentStatus = 'REJECTED';
    }

    return {
      verified,
      documentStatus,
      lastVerifiedAt: customer.kycVerifiedAt?.toISOString() || null,
    };
  }

  /**
   * Get compliance audit trail for a case (append-only log)
   */
  async getAuditTrail(caseId: string): Promise<ComplianceAuditEntry[]> {
    const activities = await prisma.caseActivity.findMany({
      where: {
        caseId,
        activityType: 'COMPLIANCE_CHECK',
      },
      orderBy: { createdAt: 'asc' },
    });

    return activities.map((a) => ({
      id: a.id,
      caseId: a.caseId,
      action: (a.metadata as Record<string, unknown>)?.action as string || 'SCREENING',
      result: (a.metadata as Record<string, unknown>)?.result as string || 'UNKNOWN',
      details: (a.metadata as Record<string, unknown>)?.details as Record<string, unknown> || {},
      performedBy: a.userId || 'SYSTEM',
      performedAt: a.createdAt.toISOString(),
    }));
  }

  /**
   * Append entry to compliance audit trail (append-only)
   */
  private async appendAuditEntry(entry: {
    caseId: string;
    action: string;
    result: string;
    details: Record<string, unknown>;
    performedBy: string;
  }): Promise<void> {
    await prisma.caseActivity.create({
      data: {
        caseId: entry.caseId,
        userId: entry.performedBy,
        activityType: 'COMPLIANCE_CHECK',
        description: `Compliance ${entry.action}: ${entry.result}`,
        metadata: {
          action: entry.action,
          result: entry.result,
          details: entry.details,
          timestamp: new Date().toISOString(),
        } as any,
      },
    });
  }

  private calculateOverallRisk(
    aml: AmlCheckResult,
    sanctions: SanctionsCheckResult,
    kyc: KycStatusResult,
  ): ComplianceCheckResult['overallRisk'] {
    if (sanctions.ofacMatch) return 'CRITICAL';
    if (sanctions.pepMatch) return 'HIGH';
    if (aml.riskScore >= 75) return 'HIGH';
    if (aml.riskScore >= 50 || !kyc.verified) return 'MEDIUM';
    if (kyc.documentStatus === 'EXPIRED') return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(
    aml: AmlCheckResult,
    sanctions: SanctionsCheckResult,
    kyc: KycStatusResult,
    overallRisk: ComplianceCheckResult['overallRisk'],
  ): string[] {
    const recommendations: string[] = [];

    if (sanctions.ofacMatch) {
      recommendations.push('BLOCK: OFAC sanctioned entity — do not proceed');
    }
    if (sanctions.pepMatch) {
      recommendations.push('ESCALATE: PEP match requires enhanced due diligence');
    }
    if (aml.riskScore >= 50) {
      recommendations.push('REVIEW: Elevated AML risk — manual review required');
    }
    if (!kyc.verified) {
      recommendations.push('ACTION: Complete KYC verification before proceeding');
    }
    if (kyc.documentStatus === 'EXPIRED') {
      recommendations.push('ACTION: Request updated identity documents');
    }
    if (overallRisk === 'LOW') {
      recommendations.push('PROCEED: No compliance concerns identified');
    }

    return recommendations;
  }
}

export const complianceService = new ComplianceService();
