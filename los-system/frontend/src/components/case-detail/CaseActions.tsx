import { useState } from 'react';
import type { Case, CaseStage } from '@/types';

interface CaseActionsProps {
  caseData: Case;
  onTransition: (toStage: string, reason?: string) => void;
  isTransitioning: boolean;
}

const NEXT_STAGE: Record<CaseStage, CaseStage | null> = {
  INTAKE: 'VERIFICATION',
  VERIFICATION: 'UNDERWRITING',
  UNDERWRITING: 'APPROVAL',
  APPROVAL: 'DOCUMENTATION',
  DOCUMENTATION: 'DISBURSEMENT',
  DISBURSEMENT: 'CLOSED',
  CLOSED: null,
};

const PREV_STAGE: Record<CaseStage, CaseStage | null> = {
  INTAKE: null,
  VERIFICATION: 'INTAKE',
  UNDERWRITING: 'VERIFICATION',
  APPROVAL: 'UNDERWRITING',
  DOCUMENTATION: 'APPROVAL',
  DISBURSEMENT: null,
  CLOSED: null,
};

export function CaseActions({ caseData, onTransition, isTransitioning }: CaseActionsProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');

  const nextStage = NEXT_STAGE[caseData.currentStage];
  const prevStage = PREV_STAGE[caseData.currentStage];
  const allTasksComplete = caseData.tasks
    ?.filter((t) => t.stage === caseData.currentStage)
    .every((t) => t.status === 'COMPLETED' || t.status === 'SKIPPED') ?? true;

  const handleAdvance = () => {
    if (nextStage) {
      onTransition(nextStage, reason || undefined);
      setReason('');
      setShowReasonInput(false);
    }
  };

  const handleReturn = () => {
    if (prevStage) {
      setShowReasonInput(true);
    }
  };

  const confirmReturn = () => {
    if (prevStage && reason.trim()) {
      onTransition(prevStage, reason);
      setReason('');
      setShowReasonInput(false);
    }
  };

  if (caseData.currentStage === 'CLOSED') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <span className="text-green-700 font-medium">Case Completed</span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Stage Actions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Current: {caseData.currentStage}
            {!allTasksComplete && ' · Complete all tasks to advance'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Return to previous stage */}
          {prevStage && !showReasonInput && (
            <button
              onClick={handleReturn}
              disabled={isTransitioning}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              ← Return to {prevStage}
            </button>
          )}

          {/* Advance to next stage */}
          {nextStage && !showReasonInput && (
            <button
              onClick={handleAdvance}
              disabled={!allTasksComplete || isTransitioning}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              title={!allTasksComplete ? 'Complete all tasks first' : `Advance to ${nextStage}`}
            >
              {isTransitioning ? 'Processing...' : `Advance to ${nextStage} →`}
            </button>
          )}
        </div>
      </div>

      {/* Reason input for return */}
      {showReasonInput && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for returning to previous stage..."
            className="flex-1 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
          <button
            onClick={confirmReturn}
            disabled={!reason.trim() || isTransitioning}
            className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
          >
            Confirm Return
          </button>
          <button
            onClick={() => { setShowReasonInput(false); setReason(''); }}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
