import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CaseTask } from '@/types';

interface TaskListProps {
  tasks: CaseTask[];
  caseId: string;
}

const STATUS_ICONS: Record<string, string> = {
  PENDING: '○',
  IN_PROGRESS: '◐',
  COMPLETED: '●',
  SKIPPED: '⊘',
  FAILED: '✕',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-muted-foreground',
  IN_PROGRESS: 'text-blue-600',
  COMPLETED: 'text-green-600',
  SKIPPED: 'text-gray-400',
  FAILED: 'text-red-600',
};

const TASK_TYPE_BADGES: Record<string, { label: string; color: string }> = {
  MANUAL: { label: 'Manual', color: 'bg-gray-100 text-gray-600' },
  AUTOMATED: { label: 'Auto', color: 'bg-blue-100 text-blue-600' },
  APPROVAL: { label: 'Approval', color: 'bg-purple-100 text-purple-600' },
  DOCUMENT_REVIEW: { label: 'Doc Review', color: 'bg-amber-100 text-amber-600' },
  VERIFICATION: { label: 'Verify', color: 'bg-cyan-100 text-cyan-600' },
};

export function TaskList({ tasks, caseId }: TaskListProps) {
  const queryClient = useQueryClient();

  const completeTask = useMutation({
    mutationFn: (taskId: string) =>
      api.patch(`/cases/${caseId}/tasks/${taskId}`, { status: 'COMPLETED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
  });

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No tasks for this stage
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const badge = TASK_TYPE_BADGES[task.taskType];
        const canComplete = task.status === 'PENDING' || task.status === 'IN_PROGRESS';

        return (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              task.status === 'COMPLETED'
                ? 'bg-green-50/50 border-green-200'
                : 'hover:bg-muted/50'
            }`}
          >
            {/* Status icon */}
            <span className={`text-lg ${STATUS_COLORS[task.status]}`}>
              {STATUS_ICONS[task.status]}
            </span>

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''
              }`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {task.description}
                </p>
              )}
            </div>

            {/* Task type badge */}
            {badge && (
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${badge.color}`}>
                {badge.label}
              </span>
            )}

            {/* Complete button */}
            {canComplete && (
              <button
                onClick={() => completeTask.mutate(task.id)}
                disabled={completeTask.isPending}
                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        );
      })}

      {/* Progress summary */}
      <div className="pt-2 border-t mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {tasks.filter((t) => t.status === 'COMPLETED').length} of {tasks.length} completed
          </span>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${(tasks.filter((t) => t.status === 'COMPLETED').length / tasks.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
