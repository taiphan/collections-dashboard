'use client';

import { ImportDialog } from './import-dialog';
import { useCollectionsStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function DashboardHeader() {
  const { records, clearAllRecords } = useCollectionsStore();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FE CREDIT Collection</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi và quản lý thu hồi nợ theo nhóm B1–B5
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {records.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllRecords}
            className="cursor-pointer gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Clear All
          </Button>
        )}
        <ImportDialog />
      </div>
    </header>
  );
}
