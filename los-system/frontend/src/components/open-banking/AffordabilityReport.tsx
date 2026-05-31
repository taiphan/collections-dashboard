import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AffordabilityData {
  customerId: string;
  period: { from: string; to: string };
  income: { salary: number; otherRegular: number; irregular: number; total: number };
  expenses: {
    housing: number; utilities: number; transport: number; food: number;
    debtRepayments: number; entertainment: number; other: number; total: number;
  };
  disposableIncome: number;
  affordableMonthlyPayment: number;
  stabilityScore: number;
  riskIndicators: string[];
  categorizationAccuracy: number;
}

interface AffordabilityReportProps {
  customerId: string;
}

export function AffordabilityReport({ customerId }: AffordabilityReportProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['affordability', customerId],
    queryFn: () => api.post<{ success: boolean; data: AffordabilityData }>(
      `/open-banking/${customerId}/affordability`,
    ),
  });

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  const report = data?.data;
  if (!report) return null;

  const incomeItems = [
    { label: 'Salary', value: report.income.salary, color: 'bg-green-500' },
    { label: 'Other Regular', value: report.income.otherRegular, color: 'bg-green-400' },
    { label: 'Irregular', value: report.income.irregular, color: 'bg-green-300' },
  ];

  const expenseItems = [
    { label: 'Housing', value: report.expenses.housing, color: 'bg-red-500' },
    { label: 'Utilities', value: report.expenses.utilities, color: 'bg-red-400' },
    { label: 'Transport', value: report.expenses.transport, color: 'bg-orange-400' },
    { label: 'Food', value: report.expenses.food, color: 'bg-orange-300' },
    { label: 'Debt Repayments', value: report.expenses.debtRepayments, color: 'bg-red-600' },
    { label: 'Entertainment', value: report.expenses.entertainment, color: 'bg-purple-400' },
    { label: 'Other', value: report.expenses.other, color: 'bg-gray-400' },
  ];

  return (
    <div className="bg-card rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Open Banking Affordability Assessment</h3>
        <span className="text-[10px] text-muted-foreground">
          Accuracy: {(report.categorizationAccuracy * 100).toFixed(0)}%
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Monthly Income</p>
          <p className="text-lg font-bold text-green-700">${report.income.total.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Disposable Income</p>
          <p className="text-lg font-bold text-blue-700">${report.disposableIncome.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-primary/5 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Affordable Payment</p>
          <p className="text-lg font-bold text-primary">${report.affordableMonthlyPayment.toLocaleString()}</p>
        </div>
      </div>

      {/* Income breakdown */}
      <div>
        <h4 className="text-xs font-medium mb-2">Income Breakdown (Monthly)</h4>
        <div className="space-y-1.5">
          {incomeItems.filter((i) => i.value > 0).map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs flex-1">{item.label}</span>
              <span className="text-xs font-medium">${item.value.toLocaleString()}</span>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${(item.value / report.income.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense breakdown */}
      <div>
        <h4 className="text-xs font-medium mb-2">Expense Breakdown (Monthly)</h4>
        <div className="space-y-1.5">
          {expenseItems.filter((i) => i.value > 0).map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs flex-1">{item.label}</span>
              <span className="text-xs font-medium">${item.value.toLocaleString()}</span>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${(item.value / report.expenses.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stability & Risk */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Income Stability</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  report.stabilityScore >= 70 ? 'bg-green-500' :
                  report.stabilityScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${report.stabilityScore}%` }}
              />
            </div>
            <span className="text-xs font-medium">{report.stabilityScore}/100</span>
          </div>
        </div>

        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Risk Indicators</p>
          {report.riskIndicators.length === 0 ? (
            <p className="text-xs text-green-600 mt-1">✓ No risk flags</p>
          ) : (
            <ul className="text-xs text-red-600 mt-1 space-y-0.5">
              {report.riskIndicators.map((r, i) => <li key={i}>⚠ {r}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
