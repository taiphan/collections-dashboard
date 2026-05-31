import { useState } from 'react';
import { useMovingAverages, useTopProducts, useReorderAlerts } from '@/hooks/use-api';

interface TopProduct {
  skuCode: string;
  productName: string;
  totalExported: number;
}

interface Alert {
  skuCode: string;
  productName: string;
  currentStock: number;
  forecastedDemand: number;
  recommendedReorder: number;
}

export function AnalyticsPage() {
  const [window, setWindow] = useState(30);
  const { data: maData } = useMovingAverages(window);
  const { data: topData } = useTopProducts(30);
  const { data: alertsData } = useReorderAlerts();

  const maResult = maData?.data as { data?: { date: string }[] } | undefined;
  const topResult = topData?.data as { top?: TopProduct[] } | undefined;
  const alerts = alertsData?.data as Alert[] | undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MovingAvgCard window={window} setWindow={setWindow} maResult={maResult} />
        <TopProductsCard topResult={topResult} />
        <ReorderAlertsCard alerts={alerts} />
      </div>
    </div>
  );
}

function MovingAvgCard({ window, setWindow, maResult }: {
  window: number;
  setWindow: (w: number) => void;
  maResult: { data?: { date: string }[] } | undefined;
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Moving Averages</h3>
        <div className="flex gap-1">
          {[7, 30, 90].map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-2 py-1 text-xs rounded ${
                window === w ? 'bg-primary text-primary-foreground' : 'border'
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>
      {maResult?.data && maResult.data.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {maResult.data.length} data points ({window}-day window)
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No data available</p>
      )}
    </div>
  );
}

function TopProductsCard({ topResult }: { topResult: { top?: TopProduct[] } | undefined }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="font-medium mb-3">Top Exported (30d)</h3>
      {topResult?.top && topResult.top.length > 0 ? (
        <div className="space-y-2">
          {topResult.top.slice(0, 5).map((p, i) => (
            <div key={i} className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">{p.productName}</span>
                <span className="text-xs text-muted-foreground ml-2">{p.skuCode}</span>
              </div>
              <span className="text-sm font-bold">{p.totalExported}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No export data</p>
      )}
    </div>
  );
}

function ReorderAlertsCard({ alerts }: { alerts: Alert[] | undefined }) {
  return (
    <div className="bg-card border rounded-lg p-4 lg:col-span-2">
      <h3 className="font-medium mb-3">Reorder Alerts</h3>
      {alerts && alerts.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">SKU</th>
              <th className="text-left py-2">Product</th>
              <th className="text-right py-2">Stock</th>
              <th className="text-right py-2">Forecast</th>
              <th className="text-right py-2">Reorder</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{a.skuCode}</td>
                <td className="py-2">{a.productName}</td>
                <td className="py-2 text-right">{a.currentStock}</td>
                <td className="py-2 text-right">{a.forecastedDemand}</td>
                <td className="py-2 text-right font-bold text-destructive">
                  {a.recommendedReorder}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No reorder alerts — stock levels healthy
        </p>
      )}
    </div>
  );
}
