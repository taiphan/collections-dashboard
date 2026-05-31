import { useState } from 'react';
import { useCreateExport, useInventory } from '@/hooks/use-api';

interface LineItem {
  skuId: string;
  skuCode: string;
  productName: string;
  available: number;
  quantity: number;
  unitPrice: number | null;
}

export function CreateExportPage({ onBack }: { onBack: () => void }) {
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState<'SALE' | 'TRANSFER' | 'RETURN'>('SALE');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [error, setError] = useState('');
  const createMutation = useCreateExport();
  const { data: inventoryData } = useInventory();

  const availableSkus = inventoryData?.data?.filter(
    (inv) => inv.quantity > 0 && !lineItems.find((li) => li.skuId === inv.skuId),
  ) || [];

  const addLineItem = (inv: typeof availableSkus[0]) => {
    setLineItems([
      ...lineItems,
      {
        skuId: inv.skuId,
        skuCode: inv.sku?.code || '',
        productName: inv.sku?.catalogItem?.name || '',
        available: inv.quantity,
        quantity: 1,
        unitPrice: null,
      },
    ]);
  };

  const updateLineItem = (index: number, field: string, value: number | null) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!destination.trim()) {
      setError('Destination is required');
      return;
    }
    if (lineItems.length === 0) {
      setError('Add at least one SKU to export');
      return;
    }

    const overStock = lineItems.find((li) => li.quantity > li.available);
    if (overStock) {
      setError(`Quantity for ${overStock.skuCode} exceeds available stock (${overStock.available})`);
      return;
    }

    try {
      await createMutation.mutateAsync({
        destination,
        reason,
        lineItems: lineItems.map((li) => ({
          skuId: li.skuId,
          quantity: li.quantity,
          unitPrice: li.unitPrice || undefined,
        })),
      });
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create export');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <h1 className="text-2xl font-semibold">Create Export Operation</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Destination *</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Customer ABC, Branch #2"
              className="w-full px-3 py-2 border rounded-md text-sm"
              maxLength={255}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as typeof reason)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="SALE">Sale</option>
              <option value="TRANSFER">Transfer</option>
              <option value="RETURN">Return to Supplier</option>
            </select>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Line Items</h3>
          </div>

          {availableSkus.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-1">Add from available stock:</label>
              <div className="flex flex-wrap gap-2">
                {availableSkus.slice(0, 10).map((inv) => (
                  <button
                    key={inv.skuId}
                    type="button"
                    onClick={() => addLineItem(inv)}
                    className="px-2 py-1 text-xs border rounded hover:bg-muted"
                  >
                    {inv.sku?.code} ({inv.quantity} avail)
                  </button>
                ))}
              </div>
            </div>
          )}

          {lineItems.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2 w-24">Available</th>
                  <th className="text-right py-2 w-28">Quantity</th>
                  <th className="text-right py-2 w-28">Unit Price</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => (
                  <tr key={li.skuId} className="border-b">
                    <td className="py-2 font-mono text-xs">{li.skuCode}</td>
                    <td className="py-2 text-muted-foreground">{li.productName}</td>
                    <td className="py-2 text-right text-muted-foreground">{li.available}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={1}
                        max={li.available}
                        value={li.quantity}
                        onChange={(e) => updateLineItem(i, 'quantity', parseInt(e.target.value) || 1)}
                        className={`w-full px-2 py-1 border rounded text-sm text-right ${
                          li.quantity > li.available ? 'border-destructive' : ''
                        }`}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={li.unitPrice || ''}
                        onChange={(e) => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || null)}
                        placeholder="Optional"
                        className="w-full px-2 py-1 border rounded text-sm text-right"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <button type="button" onClick={() => removeLineItem(i)} className="text-destructive hover:underline text-xs">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Select SKUs from available stock above
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Export'}
          </button>
          <button type="button" onClick={onBack} className="px-4 py-2 border rounded-md text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
