'use client';

import { useState } from 'react';
import {
  CollectionRecord,
  BUCKET_NAMES,
  BUCKET_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  BucketName,
  StatusType,
} from '@/lib/types';
import { useCollectionsStore, RecordFilters } from '@/lib/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Trash2 } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function CollectionsTable() {
  const { getFilteredRecords, updateRecord, deleteRecord } = useCollectionsStore();
  const [filters, setFilters] = useState<RecordFilters>({
    bucket: 'all',
    status: 'all',
    search: '',
  });

  const records = getFilteredRecords(filters);

  const handleStatusChange = (id: string, status: StatusType) => {
    updateRecord(id, { status });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search by name or account ID..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="pl-9"
            aria-label="Search accounts"
          />
        </div>
        <Select
          value={filters.bucket || 'all'}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, bucket: value as BucketName | 'all' }))
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by bucket">
            <SelectValue placeholder="All Buckets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buckets</SelectItem>
            {BUCKET_NAMES.map((bucket) => (
              <SelectItem key={bucket} value={bucket}>
                {bucket} — {BUCKET_LABELS[bucket]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, status: value as StatusType | 'all' }))
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_LABELS) as [StatusType, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Bucket</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No records found. Import data to get started.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-sm">{record.accountId}</TableCell>
                  <TableCell className="font-medium">{record.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.bucket}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(record.outstandingAmount)}
                  </TableCell>
                  <TableCell>{formatDate(record.dueDate)}</TableCell>
                  <TableCell>
                    <Select
                      value={record.status}
                      onValueChange={(value) =>
                        handleStatusChange(record.id, value as StatusType)
                      }
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs" aria-label="Change status">
                        <Badge className={`${STATUS_COLORS[record.status]} border-0 text-xs`}>
                          {STATUS_LABELS[record.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(STATUS_LABELS) as [StatusType, string][]).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRecord(record.id)}
                      aria-label={`Delete record ${record.accountId}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {records.length} record{records.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
