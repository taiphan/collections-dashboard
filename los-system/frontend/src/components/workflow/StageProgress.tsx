import type { CaseStage } from '@/types';

interface StageProgressProps {
  currentStage: CaseStage;
  completedStages?: CaseStage[];
}

const STAGES: Array<{ id: CaseStage; label: string; icon: string }> = [
  { id: 'INTAKE', label: 'Intake', icon: '📥' },
  { id: 'VERIFICATION', label: 'Verification', icon: '🔍' },
  { id: 'UNDERWRITING', label: 'Underwriting', icon: '📊' },
  { id: 'APPROVAL', label: 'Approval', icon: '✅' },
  { id: 'DOCUMENTATION', label: 'Documentation', icon: '📄' },
  { id: 'DISBURSEMENT', label: 'Disbursement', icon: '💰' },
  { id: 'CLOSED', label: 'Closed', icon: '🏁' },
];

export function StageProgress({ currentStage, completedStages = [] }: StageProgressProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((stage, index) => {
          const isCompleted = completedStages.includes(stage.id) || index < currentIndex;
          const isCurrent = stage.id === currentStage;

          return (
            <div
              key={stage.id}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isCurrent
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground'
                }`}
              >
                {isCompleted ? '✓' : stage.icon}
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center leading-tight ${
                  isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
