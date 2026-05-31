import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DocumentChecklistProps {
  applicationId: string;
}

interface ChecklistItem {
  documentType: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  status?: string;
  documentId?: string;
}

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  PENDING: { icon: '⏳', color: 'text-amber-600' },
  UPLOADED: { icon: '📤', color: 'text-blue-600' },
  VERIFIED: { icon: '✅', color: 'text-green-600' },
  REJECTED: { icon: '❌', color: 'text-red-600' },
  EXPIRED: { icon: '⏰', color: 'text-gray-500' },
};

export function DocumentChecklist({ applicationId }: DocumentChecklistProps) {
  const { data: checklistData, isLoading: checklistLoading } = useQuery({
    queryKey: ['document-checklist', applicationId],
    queryFn: () => api.get<{ success: boolean; data: ChecklistItem[] }>(
      `/applications/${applicationId}/documents/checklist`,
    ),
  });

  const { data: completenessData } = useQuery({
    queryKey: ['document-completeness', applicationId],
    queryFn: () => api.get<{ success: boolean; data: {
      complete: boolean;
      total: number;
      uploaded: number;
      verified: number;
      missing: string[];
    } }>(`/applications/${applicationId}/documents/completeness`),
  });

  const checklist = checklistData?.data || [];
  const completeness = completenessData?.data;

  if (checklistLoading) {
    return <div className="h-32 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Document Checklist</h3>
        {completeness && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${
              completeness.complete ? 'text-green-600' : 'text-amber-600'
            }`}>
              {completeness.uploaded}/{completeness.total} uploaded
            </span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  completeness.complete ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${(completeness.uploaded / completeness.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {checklist.map((item) => {
          const statusInfo = item.status ? STATUS_ICONS[item.status] : null;

          return (
            <div
              key={item.documentType}
              className={`flex items-center gap-3 p-2.5 rounded-md border ${
                item.uploaded ? 'bg-green-50/30 border-green-200' : 'border-dashed'
              }`}
            >
              {/* Status indicator */}
              <span className={statusInfo?.color || 'text-muted-foreground'}>
                {item.uploaded ? (statusInfo?.icon || '📄') : '○'}
              </span>

              {/* Document info */}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.required ? 'Required' : 'Optional'}
                  {item.status && ` · ${item.status}`}
                </p>
              </div>

              {/* Upload button */}
              {!item.uploaded && (
                <button className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors">
                  Upload
                </button>
              )}

              {/* Verify button for uploaded docs */}
              {item.uploaded && item.status === 'UPLOADED' && (
                <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                  Review
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Missing documents warning */}
      {completeness && completeness.missing.length > 0 && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs font-medium text-amber-800">Missing Documents:</p>
          <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
            {completeness.missing.map((doc) => (
              <li key={doc}>• {doc}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
