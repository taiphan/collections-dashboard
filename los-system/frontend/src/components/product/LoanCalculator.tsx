import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AmortizationResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: Array<{
    period: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

export function LoanCalculator() {
  const [principal, setPrincipal] = useState(25000);
  const [rate, setRate] = useState(8.99);
  const [tenure, setTenure] = useState(36);

  const calculateMutation = useMutation({
    mutationFn: () =>
      api.post<{ success: boolean; data: AmortizationResult }>('/products/amortization', {
        principal,
        annualRate: rate / 100,
        tenureMonths: tenure,
      }),
  });

  const result = calculateMutation.data?.data;

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-sm font-semibold mb-4">Loan Calculator</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Loan Amount ($)</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md text-sm"
            min={1000}
            step={1000}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Annual Rate (%)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md text-sm"
            min={0.1}
            max={50}
            step={0.01}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Tenure (months)</label>
          <input
            type="number"
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md text-sm"
            min={1}
            max={360}
          />
        </div>
      </div>

      <button
        onClick={() => calculateMutation.mutate()}
        disabled={calculateMutation.isPending}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {calculateMutation.isPending ? 'Calculating...' : 'Calculate'}
      </button>

      {result && (
        <div className="mt-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Monthly Payment</p>
              <p className="text-lg font-bold text-primary">
                ${result.monthlyPayment.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Payment</p>
              <p className="text-lg font-bold">
                ${result.totalPayment.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="text-lg font-bold text-amber-600">
                ${result.totalInterest.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Amortization table (first 12 months) */}
          <div>
            <h4 className="text-xs font-semibold mb-2">
              Amortization Schedule (first 12 months)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 px-2">#</th>
                    <th className="text-right py-1.5 px-2">Payment</th>
                    <th className="text-right py-1.5 px-2">Principal</th>
                    <th className="text-right py-1.5 px-2">Interest</th>
                    <th className="text-right py-1.5 px-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.slice(0, 12).map((entry) => (
                    <tr key={entry.period} className="border-b last:border-0">
                      <td className="py-1.5 px-2">{entry.period}</td>
                      <td className="text-right py-1.5 px-2">${entry.payment.toFixed(2)}</td>
                      <td className="text-right py-1.5 px-2 text-green-600">
                        ${entry.principal.toFixed(2)}
                      </td>
                      <td className="text-right py-1.5 px-2 text-amber-600">
                        ${entry.interest.toFixed(2)}
                      </td>
                      <td className="text-right py-1.5 px-2 font-medium">
                        ${entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.schedule.length > 12 && (
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                Showing 12 of {result.schedule.length} periods
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
