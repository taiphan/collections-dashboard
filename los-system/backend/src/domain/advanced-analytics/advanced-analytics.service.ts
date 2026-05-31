import { cacheGet, cacheSet } from '../../infrastructure/cache/redis.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'advanced-analytics' });
const CACHE_TTL = 300; // 5 minutes

// Types
export interface ModelMetrics {
  modelId: string;
  name: string;
  type: 'credit_score' | 'fraud' | 'collection' | 'churn';
  version: string;
  accuracy: number;
  auc: number;
  gini: number;
  ks: number;
  lastTrained: Date;
  status: 'active' | 'monitoring' | 'retired';
  driftDetected: boolean;
}

export interface PredictionResult {
  modelId: string;
  score: number;
  confidence: number;
  features: Array<{ name: string; value: number; importance: number }>;
  explanation: string;
}

export interface ModelGovernanceRecord {
  modelId: string;
  action: 'created' | 'trained' | 'validated' | 'approved' | 'deployed' | 'retired';
  performedBy: string;
  timestamp: Date;
  notes: string;
}

interface DriftReport {
  modelId: string;
  driftDetected: boolean;
  psiScore: number;
  featureDrift: Array<{ feature: string; driftScore: number; threshold: number; drifted: boolean }>;
  performanceDegradation: number;
  recommendation: string;
}

// Simulated model registry
const MODEL_REGISTRY: ModelMetrics[] = [
  {
    modelId: 'model-credit-v3',
    name: 'Credit Scorecard v3',
    type: 'credit_score',
    version: '3.2.1',
    accuracy: 0.847,
    auc: 0.891,
    gini: 0.782,
    ks: 0.634,
    lastTrained: new Date('2024-08-15'),
    status: 'active',
    driftDetected: false,
  },
  {
    modelId: 'model-fraud-v2',
    name: 'Fraud Detection Engine',
    type: 'fraud',
    version: '2.1.0',
    accuracy: 0.923,
    auc: 0.956,
    gini: 0.912,
    ks: 0.789,
    lastTrained: new Date('2024-09-01'),
    status: 'active',
    driftDetected: false,
  },
  {
    modelId: 'model-collection-v1',
    name: 'Collection Propensity',
    type: 'collection',
    version: '1.4.2',
    accuracy: 0.781,
    auc: 0.823,
    gini: 0.646,
    ks: 0.521,
    lastTrained: new Date('2024-07-20'),
    status: 'monitoring',
    driftDetected: true,
  },
  {
    modelId: 'model-churn-v1',
    name: 'Customer Churn Predictor',
    type: 'churn',
    version: '1.2.0',
    accuracy: 0.812,
    auc: 0.867,
    gini: 0.734,
    ks: 0.589,
    lastTrained: new Date('2024-06-10'),
    status: 'active',
    driftDetected: false,
  },
  {
    modelId: 'model-credit-v2',
    name: 'Credit Scorecard v2 (Legacy)',
    type: 'credit_score',
    version: '2.8.0',
    accuracy: 0.798,
    auc: 0.842,
    gini: 0.684,
    ks: 0.567,
    lastTrained: new Date('2023-12-01'),
    status: 'retired',
    driftDetected: true,
  },
];

export class AdvancedAnalyticsService {
  async listModels(): Promise<ModelMetrics[]> {
    log.info({ count: MODEL_REGISTRY.length }, 'Models listed');
    return MODEL_REGISTRY;
  }

  async predict(
    modelId: string,
    inputData: Record<string, unknown>,
  ): Promise<PredictionResult> {
    const model = MODEL_REGISTRY.find((m) => m.modelId === modelId);
    if (!model) {
      throw new NotFoundError('Model', modelId);
    }

    // Simulate prediction with explainability
    const score = Math.round((30 + Math.random() * 70) * 100) / 100;
    const confidence = Math.round((0.7 + Math.random() * 0.3) * 1000) / 1000;

    const featureNames = this.getModelFeatures(model.type);
    const features = featureNames.map((name) => ({
      name,
      value: Math.round(Math.random() * 100) / 100,
      importance: Math.round(Math.random() * 100) / 100,
    }));

    // Sort by importance descending
    features.sort((a, b) => b.importance - a.importance);

    const explanation = this.generateExplanation(model.type, score, features);

    const result: PredictionResult = {
      modelId,
      score,
      confidence,
      features,
      explanation,
    };

    log.info(
      { modelId, score, confidence, inputKeys: Object.keys(inputData) },
      'Prediction generated',
    );

    return result;
  }

  async checkModelDrift(modelId: string): Promise<DriftReport> {
    const model = MODEL_REGISTRY.find((m) => m.modelId === modelId);
    if (!model) {
      throw new NotFoundError('Model', modelId);
    }

    // Simulate drift detection
    const psiScore = Math.random() * 0.3;
    const driftThreshold = 0.15;
    const driftDetected = psiScore > driftThreshold;

    const featureNames = this.getModelFeatures(model.type);
    const featureDrift = featureNames.slice(0, 5).map((feature) => {
      const driftScore = Math.random() * 0.25;
      return {
        feature,
        driftScore: Math.round(driftScore * 1000) / 1000,
        threshold: 0.1,
        drifted: driftScore > 0.1,
      };
    });

    const performanceDegradation = driftDetected
      ? Math.round(Math.random() * 8 * 100) / 100
      : Math.round(Math.random() * 2 * 100) / 100;

    let recommendation: string;
    if (psiScore > 0.25) {
      recommendation = 'Critical drift detected. Immediate retraining recommended.';
    } else if (psiScore > 0.15) {
      recommendation = 'Moderate drift detected. Schedule retraining within 2 weeks.';
    } else {
      recommendation = 'Model performance stable. Continue monitoring.';
    }

    const report: DriftReport = {
      modelId,
      driftDetected,
      psiScore: Math.round(psiScore * 1000) / 1000,
      featureDrift,
      performanceDegradation,
      recommendation,
    };

    log.info(
      { modelId, driftDetected, psiScore: report.psiScore },
      'Drift check completed',
    );

    return report;
  }

  async getModelGovernance(modelId: string): Promise<ModelGovernanceRecord[]> {
    const model = MODEL_REGISTRY.find((m) => m.modelId === modelId);
    if (!model) {
      throw new NotFoundError('Model', modelId);
    }

    const now = Date.now();
    const records: ModelGovernanceRecord[] = [
      {
        modelId,
        action: 'created',
        performedBy: 'data-science-team',
        timestamp: new Date(now - 180 * 86400000),
        notes: `Initial ${model.name} model architecture defined`,
      },
      {
        modelId,
        action: 'trained',
        performedBy: 'ml-pipeline',
        timestamp: new Date(now - 150 * 86400000),
        notes: 'Training completed on 24-month historical dataset (500K records)',
      },
      {
        modelId,
        action: 'validated',
        performedBy: 'model-validation-team',
        timestamp: new Date(now - 140 * 86400000),
        notes: `Validation passed — AUC: ${model.auc}, Gini: ${model.gini}, KS: ${model.ks}`,
      },
      {
        modelId,
        action: 'approved',
        performedBy: 'risk-committee',
        timestamp: new Date(now - 130 * 86400000),
        notes: 'Approved for production deployment by Model Risk Committee',
      },
      {
        modelId,
        action: 'deployed',
        performedBy: 'mlops-team',
        timestamp: new Date(now - 120 * 86400000),
        notes: `Deployed to production as version ${model.version}`,
      },
    ];

    if (model.status === 'retired') {
      records.push({
        modelId,
        action: 'retired',
        performedBy: 'model-governance',
        timestamp: new Date(now - 30 * 86400000),
        notes: 'Retired due to successor model deployment',
      });
    }

    return records;
  }

  async getFeatureImportance(modelId: string): Promise<Array<{ name: string; importance: number; direction: 'positive' | 'negative' }>> {
    const model = MODEL_REGISTRY.find((m) => m.modelId === modelId);
    if (!model) {
      throw new NotFoundError('Model', modelId);
    }

    const featureNames = this.getModelFeatures(model.type);

    const features = featureNames.map((name, i) => ({
      name,
      importance: Math.round((1 - i * 0.08 + Math.random() * 0.05) * 1000) / 1000,
      direction: (Math.random() > 0.3 ? 'positive' : 'negative') as 'positive' | 'negative',
    }));

    // Sort by importance descending
    features.sort((a, b) => b.importance - a.importance);

    return features;
  }

  async compareModels(
    modelIdA: string,
    modelIdB: string,
  ): Promise<{ modelA: ModelMetrics; modelB: ModelMetrics; comparison: Record<string, { a: number; b: number; winner: string }> }> {
    const modelA = MODEL_REGISTRY.find((m) => m.modelId === modelIdA);
    const modelB = MODEL_REGISTRY.find((m) => m.modelId === modelIdB);

    if (!modelA) throw new NotFoundError('Model', modelIdA);
    if (!modelB) throw new NotFoundError('Model', modelIdB);

    const comparison: Record<string, { a: number; b: number; winner: string }> = {
      accuracy: {
        a: modelA.accuracy,
        b: modelB.accuracy,
        winner: modelA.accuracy >= modelB.accuracy ? modelIdA : modelIdB,
      },
      auc: {
        a: modelA.auc,
        b: modelB.auc,
        winner: modelA.auc >= modelB.auc ? modelIdA : modelIdB,
      },
      gini: {
        a: modelA.gini,
        b: modelB.gini,
        winner: modelA.gini >= modelB.gini ? modelIdA : modelIdB,
      },
      ks: {
        a: modelA.ks,
        b: modelB.ks,
        winner: modelA.ks >= modelB.ks ? modelIdA : modelIdB,
      },
    };

    log.info({ modelIdA, modelIdB }, 'Model comparison completed');

    return { modelA, modelB, comparison };
  }

  private getModelFeatures(type: ModelMetrics['type']): string[] {
    switch (type) {
      case 'credit_score':
        return [
          'payment_history', 'credit_utilization', 'credit_age',
          'debt_to_income', 'num_accounts', 'recent_inquiries',
          'employment_stability', 'income_level', 'delinquency_history',
          'public_records',
        ];
      case 'fraud':
        return [
          'transaction_velocity', 'amount_deviation', 'geo_anomaly',
          'device_fingerprint', 'time_of_day', 'merchant_category',
          'ip_risk_score', 'behavioral_biometrics', 'account_age',
          'previous_fraud_flags',
        ];
      case 'collection':
        return [
          'days_past_due', 'payment_history', 'contact_responsiveness',
          'income_stability', 'debt_burden', 'previous_arrangements',
          'employment_status', 'seasonal_pattern', 'loan_to_value',
          'customer_tenure',
        ];
      case 'churn':
        return [
          'engagement_frequency', 'product_usage', 'complaint_history',
          'tenure', 'satisfaction_score', 'competitive_offers',
          'life_events', 'digital_activity', 'cross_sell_count',
          'last_interaction_days',
        ];
      default:
        return ['feature_1', 'feature_2', 'feature_3'];
    }
  }

  private generateExplanation(
    type: ModelMetrics['type'],
    score: number,
    features: Array<{ name: string; importance: number }>,
  ): string {
    const topFeature = features[0]?.name || 'unknown';
    const riskLevel = score > 70 ? 'high' : score > 40 ? 'moderate' : 'low';

    switch (type) {
      case 'credit_score':
        return `Credit risk assessment indicates ${riskLevel} risk (score: ${score}). ` +
          `Primary driver: ${topFeature.replace(/_/g, ' ')}. ` +
          `Based on analysis of 10 key financial indicators.`;
      case 'fraud':
        return `Fraud probability: ${score}% (${riskLevel} risk). ` +
          `Key signal: ${topFeature.replace(/_/g, ' ')}. ` +
          `Real-time analysis of transaction patterns and behavioral signals.`;
      case 'collection':
        return `Collection recovery likelihood: ${score}%. ` +
          `Most influential factor: ${topFeature.replace(/_/g, ' ')}. ` +
          `Recommendation: ${score > 60 ? 'soft approach' : 'escalated strategy'}.`;
      case 'churn':
        return `Churn probability: ${score}% (${riskLevel}). ` +
          `Primary indicator: ${topFeature.replace(/_/g, ' ')}. ` +
          `${score > 60 ? 'Proactive retention action recommended.' : 'Customer appears stable.'}`;
      default:
        return `Prediction score: ${score} with ${riskLevel} confidence.`;
    }
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
