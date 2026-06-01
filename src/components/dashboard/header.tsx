'use client';

import { ImportDialog } from './import-dialog';
import { useCollectionsStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Trash2, BarChart3 } from 'lucide-react';

export function DashboardHeader() {
  const { records, clearAllRecords } = useCollectionsStore();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E31837]">
          <span className="text-sm font-black text-white leading-none">FC</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collection Portal</h1>
          <p className="text-sm text-muted-foreground">
            FE CREDIT · Theo dõi và quản lý thu hồi nợ theo nhóm B1–B5
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
