'use client';

import { ImportDialog } from './import-dialog';
import { Activity } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <Activity className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
      <h2 className="mb-2 text-lg font-semibold">No pipeline data yet</h2>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        Import your daily BOD data from Card V+ and Loan Finacle core systems to monitor
        the data flow into Pega. Upload a CSV with columns: date, source, bod_count, pega_count.
      </p>
      <ImportDialog />
    </div>
  );
}
