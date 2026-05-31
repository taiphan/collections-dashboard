import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '@/lib/api';
import { StageProgress } from '@/components/workflow/StageProgress';
import { TaskList } from './TaskList';
import { ActivityFeed } from './ActivityFeed';
import { CaseActions } from './CaseActions';
import type { Case, CaseStage } from '@/types';

interface CaseDetailProps {
  caseId: string;
  onBack: () => void;
}

export function CaseDetail({ caseId, onBack }: CaseDetailProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => casesApi.getById(caseId),
  });

  const transitionMutation = useMutation({
    mutationFn: ({ toStage, reason }: { toStage: string; reason?: string }) =>
      casesApi.transition(caseId, toStage, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const caseData = data?.data as Case;
  if (!caseData) return null;

  const completedStages = getCompletedStages(caseData.currentStage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-semibold">{caseData.caseNumber}</h2>
            <p className="text-sm text-muted-foreground">
              {caseData.application?.customer?.firstName} {caseData.application?.customer?.lastName}
              {' · '}
              {caseData.application?.product?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={caseData.priority} />
          <StatusBadge status={caseData.status} />
          {caseData.slaBreached && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              SLA BREACHED
            </span>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="bg-card rounded-lg border p-6">
        <StageProgress
          currentStage={caseData.currentStage}
          completedStages={completedStages}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tasks & Actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Case Actions */}
          <CaseActions
            caseData={caseData}
            onTransition={(toStage, reason) =>
              transitionMutation.mutate({ toStage, reason })
            }
            isTransitioning={transitionMutation.isPending}
          />

          {/* Tasks for current stage */}
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">
              Tasks — {caseData.currentStage}
            </h3>
            <TaskList
              tasks={caseData.tasks?.filter((t) => t.stage === caseData.currentStage) || []}
              caseId={caseId}
            />
          </div>

          {/* Application Summary */}
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">Application Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Application #" value={caseData.application?.applicationNumber} />
              <InfoRow
                label="Requested Amount"
                value={caseData.application?.requestedAmount
                  ? `$${Number(caseData.application.requestedAmount).toLocaleString()}`
                  : '—'}
              />
              <InfoRow
                label="Tenure"
                value={caseData.application?.requestedTenure
                  ? `${caseData.application.requestedTenure} months`
                  : '—'}
              />
              <InfoRow label="Channel" value={caseData.application?.channel} />
              <InfoRow label="Purpose" value={caseData.application?.purpose || '—'} />
              <InfoRow
                label="Assigned To"
                value={caseData.assignedOfficer
                  ? `${caseData.assignedOfficer.firstName} ${caseData.assignedOfficer.lastName}`
                  : 'Unassigned'}
              />
            </div>
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">Activity</h3>
            <ActivityFeed activities={caseData.activities || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

function getCompletedStages(currentStage: CaseStage): CaseStage[] {
  const order: CaseStage[] = [
    'INTAKE', 'VERIFICATION', 'UNDERWRITING',
    'APPROVAL', 'DOCUMENTATION', 'DISBURSEMENT', 'CLOSED',
  ];
  const currentIndex = order.indexOf(currentStage);
  return order.slice(0, currentIndex);
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700',
    NORMAL: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-amber-100 text-amber-700',
    URGENT: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority] || ''}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    ON_HOLD: 'bg-gray-100 text-gray-700',
    ESCALATED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || ''}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}
