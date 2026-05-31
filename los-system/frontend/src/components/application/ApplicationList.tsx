import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/lib/api';
import type { Application } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
  DISBURSED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

export function ApplicationList() {
  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list(),
  });

  const applications = (data?.data || []) as Application[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Loan Applications</h2>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          + New Application
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Application #
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Applicant
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Amount
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Channel
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium font-mono">
                      {app.applicationNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {app.customer?.firstName} {app.customer?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {app.product?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(app.requestedAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {app.channel}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[app.status] || 'bg-gray-100'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {app.submittedAt
                      ? new Date(app.submittedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
