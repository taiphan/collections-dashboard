import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PreScreeningResult {
  id: string;
  eligible: boolean;
  score: number;
  maxEligibleAmount: number;
  indicativeRate: number;
  indicativeMonthlyPayment: number;
  reasons: string[];
  dataSourcesUsed: string[];
  validUntil: string;
}

export function PreScreeningForm() {
  const [productId, setProductId] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [existingDebt, setExistingDebt] = useState<number | ''>('');
  const [consentBureau, setConsentBureau] = useState(false);
  const [consentOB, setConsentOB] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ['products-active'],
    queryFn: () => api.get<{ success: boolean; data: Array<{ id: string; name: string; productType: string }> }>('/products/active'),
  });

  const screenMutation = useMutation({
    mutationFn: () => api.post<{ success: boolean; data: PreScreeningResult }>('/pre-screening/check', {
      productId,
      applicantData: {
        age: age || undefined,
        monthlyIncome: monthlyIncome || undefined,
        employmentStatus: employmentStatus || undefined,
        existingDebt: existingDebt || undefined,
      },
      consentForBureauCheck: consentBureau,
      consentForOpenBanking: consentOB,
    }),
  });

  const result = screenMutation.data?.data;
  const products = productsData?.data || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Instant Eligibility Check</h2>
        <p className="text-muted-foreground mt-1">
          Get a pre-qualification result in seconds — no impact on your credit score
        </p>
      </div>

      {!result ? (
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Loan Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border rounded-md text-sm"
                min={18} max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Income ($)</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border rounded-md text-sm"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employment</label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select...</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="self_employed">Self-employed</option>
                <option value="contract">Contract</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Existing Debt ($)</label>
              <input
                type="number"
                value={existingDebt}
                onChange={(e) => setExistingDebt(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border rounded-md text-sm"
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={consentBureau}
                onChange={(e) => setConsentBureau(e.target.checked)}
                className="rounded"
              />
              I consent to a soft credit check (no impact on score)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={consentOB}
                onChange={(e) => setConsentOB(e.target.checked)}
                className="rounded"
              />
              I consent to Open Banking data access for better assessment
            </label>
          </div>

          <button
            onClick={() => screenMutation.mutate()}
            disabled={!productId || screenMutation.isPending}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {screenMutation.isPending ? 'Checking eligibility...' : 'Check My Eligibility'}
          </button>
        </div>
      ) : (
        <EligibilityResult result={result} onReset={() => screenMutation.reset()} />
      )}
    </div>
  );
}

function EligibilityResult({ result, onReset }: { result: PreScreeningResult; onReset: () => void }) {
  return (
    <div className={`rounded-lg border p-6 ${
      result.eligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
          result.eligible ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <span className="text-3xl">{result.eligible ? '✅' : '❌'}</span>
        </div>
        <h3 className={`text-xl font-bold ${result.eligible ? 'text-green-800' : 'text-red-800'}`}>
          {result.eligible ? 'You\'re Pre-Qualified!' : 'Not Eligible at This Time'}
        </h3>
      </div>

      {result.eligible && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-muted-foreground">Max Amount</p>
            <p className="text-lg font-bold text-green-700">
              ${result.maxEligibleAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-muted-foreground">Indicative Rate</p>
            <p className="text-lg font-bold">
              {(result.indicativeRate * 100).toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-muted-foreground">Est. Monthly</p>
            <p className="text-lg font-bold">
              ${result.indicativeMonthlyPayment.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {result.reasons.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg">
          <p className="text-sm font-medium mb-1">Reasons:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {result.reasons.map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Score: {result.score}/100</span>
        <span>Data: {result.dataSourcesUsed.join(', ')}</span>
        <span>Valid until: {new Date(result.validUntil).toLocaleDateString()}</span>
      </div>

      <div className="mt-4 flex gap-2">
        {result.eligible && (
          <button className="flex-1 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
            Proceed to Full Application →
          </button>
        )}
        <button
          onClick={onReset}
          className="px-4 py-2 border rounded-md text-sm hover:bg-white/50"
        >
          Check Again
        </button>
      </div>
    </div>
  );
}
