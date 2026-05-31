import type { CaseActivity } from '@/types';

interface ActivityFeedProps {
  activities: CaseActivity[];
}

const ACTIVITY_ICONS: Record<string, string> = {
  STAGE_CHANGE: '🔄',
  STATUS_CHANGE: '📌',
  ASSIGNMENT: '👤',
  COMMENT: '💬',
  DOCUMENT_UPLOAD: '📎',
  DECISION_MADE: '⚖️',
  TASK_COMPLETED: '✅',
  SLA_WARNING: '⚠️',
  SLA_BREACH: '🚨',
  ESCALATION: '📢',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <span className="text-sm">
              {ACTIVITY_ICONS[activity.activityType] || '•'}
            </span>
            {index < activities.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-3">
            <p className="text-xs leading-relaxed">{activity.description}</p>
            <div className="flex items-center gap-2 mt-1">
              {activity.user && (
                <span className="text-[10px] text-muted-foreground">
                  {activity.user.firstName} {activity.user.lastName}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(activity.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
