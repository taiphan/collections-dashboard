import { useState } from 'react';
import { useOperations, useSubmitOperation, useApproveOperation, useRejectOperation } from '@/hooks/use-api';
import { CreateImportPage } from './create-import';
import { CreateExportPage } from './create-export';

type View = 'list' | 'create-import' | 'create-export';

export function OperationsPage() {
  const [view, setView] = useState<View>('list');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  if (view === 'create-import') {
    return <CreateImportPage onBack={() => setView('list')} />;
  }
  if (view === 'create-export') {
    return <CreateExportPage onBack={() => setView('list')} />;
  }

  return (
    <OperationList
      typeFilter={typeFilter}
      setTypeFilter={setTypeFilter}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      onCreateImport={() => setView('create-import')}
      onCreateExport={() => setView('create-export')}
    />
  );
}

function OperationList({
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  onCreateImport,
  onCreateExport,
}: {
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onCreateImport: () => void;
  onCreateExport: () => void;
}) {
  const params: Record<string, string> = {};
  if (typeFilter) params.type = typeFilter;
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading } = useOperations(
    Object.keys(params).length > 0 ? params : undefined,
  );
  const submitMutation = useSubmitOperation();
  const approveMutation = useApproveOperation();
  const rejectMutation = useRejectOperation();

  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason (min 10 characters):');
    if (reason && reason.length >= 10) {
      rejectMutation.mutate({ id, reason });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Operations</h1>
        <div className="flex gap-2">
          <button
            onClick={onCreateImport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            + Import
          </button>
          <button
            onClick={onCreateExport}
            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm"
          >
            + Export
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All Types</option>
          <option value="IMPORT">Import</option>
          <option value="EXPORT">Export</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Number</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Items</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No operations found. Create an import or export to get started.
                </td>
              </tr>
            ) : (
              data?.data?.map((op) => (
                <tr key={op.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{op.operationNumber}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        op.type === 'IMPORT'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      }`}
                    >
                      {op.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={op.status} />
                  </td>
                  <td className="px-4 py-3">{op._count?.lineItems || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(op.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {op.status === 'DRAFT' && (
                        <button
                          onClick={() => submitMutation.mutate(op.id)}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          Submit
                        </button>
                      )}
                      {op.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(op.id)}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(op.id)}
                            className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data?.pagination && (
          <div className="px-4 py-3 border-t text-xs text-muted-foreground">
            {data.pagination.total} operations total
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || ''}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
