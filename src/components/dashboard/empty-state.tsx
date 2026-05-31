'use client';

import { ImportDialog } from './import-dialog';
import { FileSpreadsheet } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
      <h2 className="mb-2 text-lg font-semibold">No collection data yet</h2>
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
        Import your collection records from a CSV file to start monitoring buckets B1 through B5.
      </p>
      <ImportDialog />
    </div>
  );
}
