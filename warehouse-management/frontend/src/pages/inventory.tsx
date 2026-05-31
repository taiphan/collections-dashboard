import { useState } from 'react';
import { useInventory } from '@/hooks/use-api';

export function InventoryPage() {
  const [stockFilter, setStockFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const params: Record<string, string> = {};
  if (stockFilter) params.stockStatus = stockFilter;
  if (search) params.skuCode = search;

  const { data, isLoading } = useInventory(Object.keys(params).length > 0 ? params : undefined);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Inventory</h1>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search by SKU code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm w-64"
        />
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All Stock Levels</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">SKU Code</th>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-right px-4 py-3 font-medium">Quantity</th>
              <th className="text-left px-4 py-3 font-medium">Location</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : data?.data?.map((inv) => (
              <tr key={inv.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{inv.sku?.code}</td>
                <td className="px-4 py-3">{inv.sku?.catalogItem?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.sku?.catalogItem?.category}</td>
                <td className="px-4 py-3 text-right font-medium">{inv.quantity}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.location || '—'}</td>
                <td className="px-4 py-3"><StockBadge status={inv.stockStatus || 'in_stock'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && (
          <div className="px-4 py-3 border-t text-xs text-muted-foreground">
            {data.pagination.total} inventory records
          </div>
        )}
      </div>
    </div>
  );
}

function StockBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_stock: 'bg-green-100 text-green-700',
    low_stock: 'bg-yellow-100 text-yellow-700',
    out_of_stock: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
