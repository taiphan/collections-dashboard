'use client';

import { usePipelineStore } from '@/lib/store';
import { ImportDialog } from './import-dialog';
import { Button } from '@/components/ui/button';
import { Activity, Trash2 } from 'lucide-react';

export function DashboardHeader() {
  const { records, clearAllRecords } = usePipelineStore();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Activity className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Data flow: Core Systems (Card V+ &amp; Loan Finacle) → Pega
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
