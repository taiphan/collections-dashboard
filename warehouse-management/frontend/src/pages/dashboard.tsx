import { useInventory, useOperations } from '@/hooks/use-api';

export function DashboardPage() {
  const { data: inventoryData } = useInventory();
  const { data: operationsData } = useOperations({ status: 'PENDING_REVIEW' });

  const totalSkus = inventoryData?.pagination?.total || 0;
  const pendingOps = operationsData?.pagination?.total || 0;
  const lowStockCount = inventoryData?.data?.filter(
    (r) => r.stockStatus === 'low_stock' || r.stockStatus === 'out_of_stock',
  ).length || 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total SKUs" value={totalSkus} icon="📦" />
        <StatCard title="Pending Operations" value={pendingOps} icon="⏳" color="yellow" />
        <StatCard title="Low Stock Items" value={lowStockCount} icon="⚠️" color="red" />
        <StatCard title="Active" value="Online" icon="✅" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-3">Recent Pending Operations</h3>
          {operationsData?.data?.slice(0, 5).map((op) => (
            <div key={op.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <span className="text-sm font-medium">{op.operationNumber}</span>
                <span className="text-xs text-muted-foreground ml-2">{op.type}</span>
              </div>
              <StatusBadge status={op.status} />
            </div>
          )) || <p className="text-sm text-muted-foreground">No pending operations</p>}
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-3">Low Stock Alerts</h3>
          {inventoryData?.data?.filter((r) => r.stockStatus !== 'in_stock').slice(0, 5).map((inv) => (
            <div key={inv.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <span className="text-sm font-medium">{inv.sku?.code}</span>
                <span className="text-xs text-muted-foreground ml-2">{inv.sku?.catalogItem?.name}</span>
              </div>
              <span className="text-sm font-medium text-destructive">{inv.quantity} units</span>
            </div>
          )) || <p className="text-sm text-muted-foreground">All stock levels healthy</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color?: string }) {
  const colorClass = color === 'red' ? 'text-destructive' : color === 'yellow' ? 'text-yellow-600' : color === 'green' ? 'text-green-600' : '';
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || ''}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
