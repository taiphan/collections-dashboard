import { useState } from 'react';
import { useCreateImport } from '@/hooks/use-api';
import { api } from '@/lib/api';

interface LineItem {
  skuId: string;
  skuCode: string;
  quantity: number;
  unitCost: number | null;
}

interface SkuSearchResult {
  id: string;
  code: string;
  catalogItem: { name: string };
}

export function CreateImportPage({ onBack }: { onBack: () => void }) {
  const [supplierRef, setSupplierRef] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [skuSearch, setSkuSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SkuSearchResult[]>([]);
  const [error, setError] = useState('');
  const createMutation = useCreateImport();

  const searchSku = async (query: string) => {
    setSkuSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: SkuSearchResult[] }>(
        '/catalog-items',
        { search: query },
      );
      // Flatten SKUs from catalog items
      const items = res.data as unknown as { id: string; name: string; skus: { id: string; code: string }[] }[];
      const skus: SkuSearchResult[] = [];
      for (const item of items) {
        if (item.skus) {
          for (const sku of item.skus) {
            skus.push({ id: sku.id, code: sku.code, catalogItem: { name: item.name } });
          }
        }
      }
      setSearchResults(skus);
    } catch {
      setSearchResults([]);
    }
  };

  const addLineItem = (sku: SkuSearchResult) => {
    if (lineItems.find((li) => li.skuId === sku.id)) return;
    setLineItems([...lineItems, { skuId: sku.id, skuCode: sku.code, quantity: 1, unitCost: null }]);
    setSkuSearch('');
    setSearchResults([]);
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

    if (lineItems.length === 0) {
      setError('Add at least one SKU to import');
      return;
    }

    try {
      await createMutation.mutateAsync({
        supplierRef: supplierRef || undefined,
        expectedDate: expectedDate || undefined,
        lineItems: lineItems.map((li) => ({
          skuId: li.skuId,
          quantity: li.quantity,
          unitCost: li.unitCost || undefined,
        })),
      });
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create import');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <h1 className="text-2xl font-semibold">Create Import Operation</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Supplier Reference</label>
            <input
              value={supplierRef}
              onChange={(e) => setSupplierRef(e.target.value)}
              placeholder="e.g. PO-2026-001"
              className="w-full px-3 py-2 border rounded-md text-sm"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expected Delivery</label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-3">Line Items</h3>

          <div className="relative mb-4">
            <input
              value={skuSearch}
              onChange={(e) => searchSku(e.target.value)}
              placeholder="Search SKU by code or product name..."
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-auto">
                {searchResults.map((sku) => (
                  <button
                    key={sku.id}
                    type="button"
                    onClick={() => addLineItem(sku)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    <span className="font-mono">{sku.code}</span>
                    <span className="text-muted-foreground ml-2">{sku.catalogItem.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {lineItems.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-right py-2 w-32">Quantity</th>
                  <th className="text-right py-2 w-32">Unit Cost</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => (
                  <tr key={li.skuId} className="border-b">
                    <td className="py-2 font-mono text-xs">{li.skuCode}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={1}
                        max={999999}
                        value={li.quantity}
                        onChange={(e) => updateLineItem(i, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border rounded text-sm text-right"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={li.unitCost || ''}
                        onChange={(e) => updateLineItem(i, 'unitCost', parseFloat(e.target.value) || null)}
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
              Search and add SKUs above
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
            {createMutation.isPending ? 'Creating...' : 'Create Import'}
          </button>
          <button type="button" onClick={onBack} className="px-4 py-2 border rounded-md text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
