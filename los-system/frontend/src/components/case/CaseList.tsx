import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { casesApi } from '@/lib/api';
import type { Case, CaseStage } from '@/types';

const STAGE_COLORS: Record<CaseStage, string> = {
  INTAKE: 'bg-blue-100 text-blue-800',
  VERIFICATION: 'bg-purple-100 text-purple-800',
  UNDERWRITING: 'bg-amber-100 text-amber-800',
  APPROVAL: 'bg-green-100 text-green-800',
  DOCUMENTATION: 'bg-indigo-100 text-indigo-800',
  DISBURSEMENT: 'bg-cyan-100 text-cyan-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const PRIORITY_INDICATORS: Record<string, string> = {
  LOW: '○',
  NORMAL: '●',
  HIGH: '▲',
  URGENT: '🔴',
};

export function CaseList({ onSelectCase }: { onSelectCase?: (caseId: string) => void }) {
  const [stageFilter, setStageFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const params: Record<string, string> = {};
  if (stageFilter) params.stage = stageFilter;
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['cases', params],
    queryFn: () => casesApi.list(params),
  });

  const cases = (data?.data || []) as Case[];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-1.5 border rounded-md text-sm bg-background"
          aria-label="Filter by stage"
        >
          <option value="">All Stages</option>
          <option value="INTAKE">Intake</option>
          <option value="VERIFICATION">Verification</option>
          <option value="UNDERWRITING">Underwriting</option>
          <option value="APPROVAL">Approval</option>
          <option value="DOCUMENTATION">Documentation</option>
          <option value="DISBURSEMENT">Disbursement</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border rounded-md text-sm bg-background"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="ESCALATED">Escalated</option>
        </select>
      </div>

      {/* Case Table */}
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
                  Case
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Applicant
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Stage
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Assigned To
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  SLA
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  onClick={() => onSelectCase?.(caseItem.id)}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{caseItem.caseNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {caseItem.application?.customer?.firstName}{' '}
                    {caseItem.application?.customer?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {caseItem.application?.product?.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        STAGE_COLORS[caseItem.currentStage]
                      }`}
                    >
                      {caseItem.currentStage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span title={caseItem.priority}>
                      {PRIORITY_INDICATORS[caseItem.priority]} {caseItem.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {caseItem.assignedOfficer
                      ? `${caseItem.assignedOfficer.firstName} ${caseItem.assignedOfficer.lastName}`
                      : 'Unassigned'}
                  </td>
                  <td className="px-4 py-3">
                    {caseItem.slaBreached ? (
                      <span className="text-xs text-destructive font-medium">BREACHED</span>
                    ) : caseItem.slaDeadline ? (
                      <span className="text-xs text-muted-foreground">
                        {new Date(caseItem.slaDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No cases found
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
