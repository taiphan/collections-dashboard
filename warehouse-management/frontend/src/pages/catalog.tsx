import { useState } from 'react';
import { useCatalogItems, useCreateCatalogItem } from '@/hooks/use-api';

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useCatalogItems(search ? { search } : undefined);
  const createMutation = useCreateCatalogItem();

  const [form, setForm] = useState({ name: '', category: '', unitOfMeasure: '', description: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    setForm({ name: '', category: '', unitOfMeasure: '', description: '' });
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Catalog Items</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          + New Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm"
            required
          />
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm"
            required
          />
          <input
            placeholder="Unit of Measure"
            value={form.unitOfMeasure}
            onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm"
            required
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm"
          />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mb-4">
        <input
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border rounded-md text-sm"
        />
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Unit</th>
              <th className="text-left px-4 py-3 font-medium">SKUs</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : data?.data?.map((item) => (
              <tr key={item.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">{item.unitOfMeasure}</td>
                <td className="px-4 py-3">{item._count?.skus || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && (
          <div className="px-4 py-3 border-t text-xs text-muted-foreground">
            Showing {data.data.length} of {data.pagination.total} items
          </div>
        )}
      </div>
    </div>
  );
}
