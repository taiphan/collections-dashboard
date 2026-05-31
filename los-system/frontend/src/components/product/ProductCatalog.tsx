import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';

interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  productType: string;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  baseInterestRate: number;
  interestType: string;
  isActive: boolean;
}

const PRODUCT_TYPE_ICONS: Record<string, string> = {
  PERSONAL: '💳',
  MORTGAGE: '🏠',
  AUTO: '🚗',
  SME: '🏢',
  COMMERCIAL: '🏭',
  CREDIT_LINE: '💰',
};

export function ProductCatalog() {
  const [typeFilter, setTypeFilter] = useState('');

  const params: Record<string, string> = { isActive: 'true' };
  if (typeFilter) params.productType = typeFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => api.get<{ success: boolean; data: LoanProduct[] }>('/products', params),
  });

  const products = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Loan Products</h2>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm bg-background"
            aria-label="Filter by product type"
          >
            <option value="">All Types</option>
            <option value="PERSONAL">Personal</option>
            <option value="MORTGAGE">Mortgage</option>
            <option value="AUTO">Auto</option>
            <option value="SME">SME</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
          <button className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            + Add Product
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: LoanProduct }) {
  return (
    <div className="bg-card rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{PRODUCT_TYPE_ICONS[product.productType] || '📋'}</span>
          <div>
            <h3 className="font-semibold text-sm">{product.name}</h3>
            <p className="text-[10px] text-muted-foreground font-mono">{product.code}</p>
          </div>
        </div>
        <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
          product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {product.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {product.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Amount Range</span>
          <p className="font-medium">
            ${Number(product.minAmount).toLocaleString()} – ${Number(product.maxAmount).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Tenure</span>
          <p className="font-medium">
            {product.minTenureMonths} – {product.maxTenureMonths} months
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Base Rate</span>
          <p className="font-medium">{(Number(product.baseInterestRate) * 100).toFixed(2)}%</p>
        </div>
        <div>
          <span className="text-muted-foreground">Interest Type</span>
          <p className="font-medium">{product.interestType}</p>
        </div>
      </div>
    </div>
  );
}
