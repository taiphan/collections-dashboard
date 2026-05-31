import { DecisionOutcome, DecisionType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'decision-engine' });

interface RuleCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: unknown;
}

interface RuleAction {
  type: 'APPROVE' | 'REJECT' | 'REFER' | 'SCORE_ADJUST';
  value?: unknown;
  message?: string;
}

interface EvaluationContext {
  requestedAmount: number;
  requestedTenure: number;
  monthlyIncome: number;
  existingDebt: number;
  creditScore?: number;
  employmentYears?: number;
  age?: number;
  loanToValue?: number;
  [key: string]: unknown;
}

interface EvaluationResult {
  outcome: DecisionOutcome;
  score: number;
  reasoning: Array<{ rule: string; result: string; impact: number }>;
  conditions?: Array<{ type: string; description: string }>;
}

export class DecisionEngineService {
  async evaluateApplication(
    caseId: string,
    decisionType: DecisionType,
    context: EvaluationContext,
    ruleSetName?: string,
  ): Promise<EvaluationResult> {
    // Load rule set
    const ruleSet = await prisma.decisionRuleSet.findFirst({
      where: {
        name: ruleSetName || this.getDefaultRuleSet(decisionType),
        isActive: true,
      },
      include: {
        rules: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!ruleSet) {
      // Fall back to built-in rules
      return this.evaluateBuiltInRules(caseId, decisionType, context);
    }

    // Evaluate rules
    const reasoning: EvaluationResult['reasoning'] = [];
    let totalScore = 100; // Start with perfect score
    let hasReject = false;
    let hasRefer = false;
    const conditions: Array<{ type: string; description: string }> = [];

    for (const rule of ruleSet.rules) {
      const condition = rule.condition as unknown as RuleCondition;
      const action = rule.action as unknown as RuleAction;

      const matches = this.evaluateCondition(condition, context);

      if (matches) {
        switch (action.type) {
          case 'REJECT':
            hasReject = true;
            reasoning.push({
              rule: rule.name,
              result: 'REJECT',
              impact: -100,
            });
            break;
          case 'REFER':
            hasRefer = true;
            reasoning.push({
              rule: rule.name,
              result: 'REFER',
              impact: -20,
            });
            break;
          case 'SCORE_ADJUST':
            const adjustment = Number(action.value) || 0;
            totalScore += adjustment;
            reasoning.push({
              rule: rule.name,
              result: `Score adjusted by ${adjustment}`,
              impact: adjustment,
            });
            break;
          case 'APPROVE':
            reasoning.push({
              rule: rule.name,
              result: 'APPROVE',
              impact: 0,
            });
            break;
        }

        if (action.message) {
          conditions.push({ type: action.type, description: action.message });
        }
      }
    }

    // Determine outcome
    let outcome: DecisionOutcome;
    if (hasReject) {
      outcome = 'REJECTED';
      totalScore = Math.min(totalScore, 30);
    } else if (hasRefer) {
      outcome = 'REFERRED';
    } else if (totalScore >= 70) {
      outcome = 'APPROVED';
    } else if (totalScore >= 50) {
      outcome = 'CONDITIONAL';
    } else {
      outcome = 'REJECTED';
    }

    // Store decision
    await prisma.decision.create({
      data: {
        caseId,
        decisionType,
        outcome,
        score: Math.max(0, Math.min(100, totalScore)),
        reasoning: reasoning as any,
        conditions: conditions.length > 0 ? conditions as any : undefined,
        isAutomated: true,
      },
    });

    log.info(
      { caseId, decisionType, outcome, score: totalScore },
      'Decision evaluated',
    );

    return { outcome, score: totalScore, reasoning, conditions };
  }

  private evaluateBuiltInRules(
    caseId: string,
    decisionType: DecisionType,
    context: EvaluationContext,
  ): EvaluationResult {
    const reasoning: EvaluationResult['reasoning'] = [];
    let score = 100;

    // DTI check (max 43%)
    const dti = context.existingDebt / context.monthlyIncome;
    if (dti > 0.43) {
      score -= 40;
      reasoning.push({
        rule: 'DTI Ratio Check',
        result: `DTI ${(dti * 100).toFixed(1)}% exceeds 43% threshold`,
        impact: -40,
      });
    } else if (dti > 0.36) {
      score -= 15;
      reasoning.push({
        rule: 'DTI Ratio Check',
        result: `DTI ${(dti * 100).toFixed(1)}% is elevated (36-43%)`,
        impact: -15,
      });
    }

    // Income-to-loan ratio
    const monthlyPayment = context.requestedAmount / context.requestedTenure;
    const paymentToIncome = monthlyPayment / context.monthlyIncome;
    if (paymentToIncome > 0.4) {
      score -= 30;
      reasoning.push({
        rule: 'Payment-to-Income',
        result: `Monthly payment is ${(paymentToIncome * 100).toFixed(1)}% of income`,
        impact: -30,
      });
    }

    // Credit score (if available)
    if (context.creditScore) {
      if (context.creditScore >= 750) {
        score += 10;
        reasoning.push({ rule: 'Credit Score', result: 'Excellent', impact: 10 });
      } else if (context.creditScore >= 650) {
        reasoning.push({ rule: 'Credit Score', result: 'Good', impact: 0 });
      } else if (context.creditScore >= 550) {
        score -= 20;
        reasoning.push({ rule: 'Credit Score', result: 'Fair', impact: -20 });
      } else {
        score -= 50;
        reasoning.push({ rule: 'Credit Score', result: 'Poor', impact: -50 });
      }
    }

    // Employment stability
    if (context.employmentYears && context.employmentYears >= 3) {
      score += 5;
      reasoning.push({ rule: 'Employment Stability', result: '3+ years', impact: 5 });
    }

    // Determine outcome
    let outcome: DecisionOutcome;
    if (score >= 70) outcome = 'APPROVED';
    else if (score >= 50) outcome = 'CONDITIONAL';
    else if (score >= 30) outcome = 'REFERRED';
    else outcome = 'REJECTED';

    return { outcome, score: Math.max(0, Math.min(100, score)), reasoning };
  }

  private evaluateCondition(condition: RuleCondition, context: EvaluationContext): boolean {
    const fieldValue = context[condition.field];
    if (fieldValue === undefined || fieldValue === null) return false;

    const numValue = Number(fieldValue);
    const condValue = Number(condition.value);

    switch (condition.operator) {
      case 'eq': return fieldValue === condition.value;
      case 'neq': return fieldValue !== condition.value;
      case 'gt': return numValue > condValue;
      case 'gte': return numValue >= condValue;
      case 'lt': return numValue < condValue;
      case 'lte': return numValue <= condValue;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'between': {
        const [min, max] = condition.value as [number, number];
        return numValue >= min && numValue <= max;
      }
      default: return false;
    }
  }

  private getDefaultRuleSet(decisionType: DecisionType): string {
    const mapping: Record<DecisionType, string> = {
      PRE_QUALIFICATION: 'pre-qualification-rules',
      CREDIT_CHECK: 'credit-check-rules',
      UNDERWRITING: 'underwriting-rules',
      FINAL_APPROVAL: 'final-approval-rules',
      EXCEPTION: 'exception-rules',
    };
    return mapping[decisionType];
  }
}

// Need to import Prisma for JsonValue type
import { Prisma } from '@prisma/client';

export const decisionEngineService = new DecisionEngineService();
