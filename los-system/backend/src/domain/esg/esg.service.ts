import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'esg-service' });

// ============================================================
// Types
// ============================================================

export interface EsgFactor {
  category: 'E' | 'S' | 'G';
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  source: string;
  description: string;
}

export interface EsgScore {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  factors: EsgFactor[];
  pricingAdjustment: number; // basis points (negative = discount)
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface EsgCriteria {
  id: string;
  category: 'E' | 'S' | 'G';
  name: string;
  description: string;
  weight: number;
  scoringMethod: 'binary' | 'scale' | 'threshold';
  config: Record<string, unknown>;
}

export interface EsgAssessmentInput {
  customerId: string;
  applicationId: string;
  loanPurpose?: string;
  industry?: string;
  propertyType?: string;
  vehicleType?: string;
  companySize?: string;
  renewableEnergy?: boolean;
  socialImpact?: boolean;
  governanceRating?: number;
}

// ============================================================
// Default ESG Criteria
// ============================================================

const DEFAULT_CRITERIA: EsgCriteria[] = [
  // Environmental
  {
    id: 'e1', category: 'E', name: 'Green Purpose',
    description: 'Loan purpose supports environmental sustainability',
    weight: 0.3, scoringMethod: 'binary',
    config: { greenPurposes: ['solar_panel', 'ev_purchase', 'energy_efficiency', 'green_building'] },
  },
  {
    id: 'e2', category: 'E', name: 'Energy Efficiency',
    description: 'Property/asset energy rating',
    weight: 0.25, scoringMethod: 'scale',
    config: { ratings: { A: 100, B: 80, C: 60, D: 40, E: 20, F: 0 } },
  },
  {
    id: 'e3', category: 'E', name: 'Carbon Footprint',
    description: 'Industry carbon intensity',
    weight: 0.2, scoringMethod: 'threshold',
    config: { lowCarbon: ['technology', 'services', 'healthcare'], highCarbon: ['mining', 'oil_gas', 'heavy_industry'] },
  },
  {
    id: 'e4', category: 'E', name: 'Renewable Energy',
    description: 'Use of renewable energy sources',
    weight: 0.25, scoringMethod: 'binary',
    config: {},
  },
  // Social
  {
    id: 's1', category: 'S', name: 'Social Impact',
    description: 'Loan supports social objectives (affordable housing, education)',
    weight: 0.35, scoringMethod: 'binary',
    config: { socialPurposes: ['affordable_housing', 'education', 'healthcare', 'community'] },
  },
  {
    id: 's2', category: 'S', name: 'Employment Impact',
    description: 'Business loan creating jobs',
    weight: 0.3, scoringMethod: 'threshold',
    config: { jobCreation: true },
  },
  {
    id: 's3', category: 'S', name: 'Financial Inclusion',
    description: 'Serving underbanked populations',
    weight: 0.35, scoringMethod: 'binary',
    config: {},
  },
  // Governance
  {
    id: 'g1', category: 'G', name: 'Corporate Governance',
    description: 'Company governance rating (for business loans)',
    weight: 0.4, scoringMethod: 'scale',
    config: { min: 0, max: 100 },
  },
  {
    id: 'g2', category: 'G', name: 'Transparency',
    description: 'Financial reporting transparency',
    weight: 0.3, scoringMethod: 'binary',
    config: {},
  },
  {
    id: 'g3', category: 'G', name: 'Compliance History',
    description: 'No regulatory violations',
    weight: 0.3, scoringMethod: 'binary',
    config: {},
  },
];

// ============================================================
// Service
// ============================================================

export class EsgService {
  async calculateScore(input: EsgAssessmentInput): Promise<EsgScore> {
    const factors: EsgFactor[] = [];

    // Environmental scoring
    const envFactors = this.scoreEnvironmental(input);
    factors.push(...envFactors);

    // Social scoring
    const socialFactors = this.scoreSocial(input);
    factors.push(...socialFactors);

    // Governance scoring
    const govFactors = this.scoreGovernance(input);
    factors.push(...govFactors);

    // Calculate category scores
    const environmental = this.weightedAverage(envFactors);
    const social = this.weightedAverage(socialFactors);
    const governance = this.weightedAverage(govFactors);

    // Overall score (equal weight across E, S, G)
    const overall = Math.round((environmental + social + governance) / 3);

    // Pricing adjustment (basis points)
    // High ESG = discount, Low ESG = no adjustment (not penalty)
    let pricingAdjustment = 0;
    if (overall >= 80) pricingAdjustment = -25; // 25bp discount
    else if (overall >= 60) pricingAdjustment = -10; // 10bp discount
    else if (overall >= 40) pricingAdjustment = 0;
    else pricingAdjustment = 5; // Slight premium for low ESG

    // Grade
    let grade: EsgScore['grade'];
    if (overall >= 80) grade = 'A';
    else if (overall >= 60) grade = 'B';
    else if (overall >= 40) grade = 'C';
    else if (overall >= 20) grade = 'D';
    else grade = 'E';

    const result: EsgScore = {
      overall,
      environmental,
      social,
      governance,
      factors,
      pricingAdjustment,
      grade,
    };

    log.info(
      { customerId: input.customerId, overall, grade, pricingAdjustment },
      'ESG score calculated',
    );

    return result;
  }

  getCriteria(): EsgCriteria[] {
    return DEFAULT_CRITERIA;
  }

  private scoreEnvironmental(input: EsgAssessmentInput): EsgFactor[] {
    const factors: EsgFactor[] = [];

    // Green purpose
    const greenPurposes = ['solar_panel', 'ev_purchase', 'energy_efficiency', 'green_building'];
    const isGreen = input.loanPurpose ? greenPurposes.includes(input.loanPurpose) : false;
    factors.push({
      category: 'E', name: 'Green Purpose',
      score: isGreen ? 100 : 30,
      weight: 0.3, source: 'application',
      description: isGreen ? 'Loan supports green initiative' : 'Standard purpose',
    });

    // Vehicle type (for auto loans)
    if (input.vehicleType) {
      const vehicleScore = input.vehicleType === 'electric' ? 100
        : input.vehicleType === 'hybrid' ? 70
        : input.vehicleType === 'diesel' ? 20 : 40;
      factors.push({
        category: 'E', name: 'Vehicle Emissions',
        score: vehicleScore,
        weight: 0.25, source: 'application',
        description: `Vehicle type: ${input.vehicleType}`,
      });
    }

    // Renewable energy
    factors.push({
      category: 'E', name: 'Renewable Energy',
      score: input.renewableEnergy ? 100 : 30,
      weight: 0.2, source: 'application',
      description: input.renewableEnergy ? 'Uses renewable energy' : 'No renewable energy data',
    });

    // Industry carbon
    const lowCarbon = ['technology', 'services', 'healthcare', 'education'];
    const industryScore = input.industry
      ? (lowCarbon.includes(input.industry) ? 80 : 40)
      : 50;
    factors.push({
      category: 'E', name: 'Industry Carbon',
      score: industryScore,
      weight: 0.25, source: 'application',
      description: `Industry: ${input.industry || 'unknown'}`,
    });

    return factors;
  }

  private scoreSocial(input: EsgAssessmentInput): EsgFactor[] {
    const factors: EsgFactor[] = [];

    // Social impact
    const socialPurposes = ['affordable_housing', 'education', 'healthcare', 'community'];
    const isSocial = input.loanPurpose ? socialPurposes.includes(input.loanPurpose) : false;
    factors.push({
      category: 'S', name: 'Social Impact',
      score: isSocial || input.socialImpact ? 100 : 40,
      weight: 0.4, source: 'application',
      description: isSocial ? 'Supports social objectives' : 'Standard purpose',
    });

    // Employment (for business loans)
    if (input.companySize) {
      const empScore = input.companySize === 'large' ? 60
        : input.companySize === 'medium' ? 70
        : input.companySize === 'small' ? 80 : 50;
      factors.push({
        category: 'S', name: 'Employment Impact',
        score: empScore,
        weight: 0.3, source: 'application',
        description: `Company size: ${input.companySize}`,
      });
    } else {
      factors.push({
        category: 'S', name: 'Employment Impact',
        score: 50, weight: 0.3, source: 'default',
        description: 'Not applicable (individual loan)',
      });
    }

    // Financial inclusion (default neutral)
    factors.push({
      category: 'S', name: 'Financial Inclusion',
      score: 50, weight: 0.3, source: 'default',
      description: 'Standard applicant profile',
    });

    return factors;
  }

  private scoreGovernance(input: EsgAssessmentInput): EsgFactor[] {
    const factors: EsgFactor[] = [];

    // Corporate governance
    factors.push({
      category: 'G', name: 'Governance Rating',
      score: input.governanceRating || 50,
      weight: 0.4, source: input.governanceRating ? 'external' : 'default',
      description: input.governanceRating
        ? `External rating: ${input.governanceRating}/100`
        : 'No governance data available',
    });

    // Transparency (default for individuals)
    factors.push({
      category: 'G', name: 'Transparency',
      score: 60, weight: 0.3, source: 'default',
      description: 'Standard transparency level',
    });

    // Compliance
    factors.push({
      category: 'G', name: 'Compliance History',
      score: 70, weight: 0.3, source: 'default',
      description: 'No known compliance issues',
    });

    return factors;
  }

  private weightedAverage(factors: EsgFactor[]): number {
    if (factors.length === 0) return 50;
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }
}

export const esgService = new EsgService();
