import { useState } from 'react';
import { useReport } from '@/hooks/use-api';

export function ReportsPage() {
  const [periodType, setPeriodType] = useState('monthly');
  const { data, isLoading } = useReport({ periodType });
  const report = data?.data;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Reports</h1>

      <div className="flex gap-3 mb-6">
        {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriodType(p)}
            className={`px-3 py-1.5 rounded-md text-sm capitalize ${
              periodType === p
                ? 'bg-primary text-primary-foreground'
                : 'border hover:bg-muted'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading report...</p>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard label="Total Imports" value={report.totalImports} />
            <SummaryCard label="Total Exports" value={report.totalExports} />
            <SummaryCard label="Net Change" value={report.netInventoryChange} />
            <SummaryCard label="Operations" value={report.operationCount} />
          </div>

          {report.topProducts.length > 0 && (
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-medium mb-3">Top Products</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">SKU</th>
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">Moved</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{p.skuCode}</td>
                      <td className="py-2">{p.productName}</td>
                      <td className="py-2 text-right font-medium">
                        {p.totalMoved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">
          Select a period to generate a report.
        </p>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
