'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { useCollectionsStore, RecordFilters } from '@/lib/store';
import {
  BUCKET_NAMES,
  BUCKET_LABELS,
  BUCKET_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  BucketName,
  StatusType,
  CollectionRecord,
} from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function getPriorityLevel(record: CollectionRecord): 'critical' | 'high' | 'medium' | 'low' {
  if (record.bucket === 'B5' || record.bucket === 'B4') return 'critical';
  if (record.bucket === 'B3') return 'high';
  if (record.bucket === 'B2') return 'medium';
  return 'low';
}

const PRIORITY_STYLES = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
};

export default function CasesPage() {
  const { getFilteredRecords, updateRecord } = useCollectionsStore();
  const [filters, setFilters] = useState<RecordFilters>({
    bucket: 'all',
    status: 'all',
    search: '',
  });
  const [selectedCase, setSelectedCase] = useState<CollectionRecord | null>(null);

  const records = getFilteredRecords(filters);

  return (
    <>
      <AppHeader title="Cases" description="Collection case management" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            {(['pending', 'contacted', 'promised', 'paid'] as StatusType[]).map((status) => {
              const count = records.filter((r) => r.status === status).length;
              return (
                <Card
                  key={status}
                  className="cursor-pointer transition-shadow duration-200 hover:shadow-md"
                  onClick={() => setFilters((f) => ({ ...f, status }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {STATUS_LABELS[status]}
                      </span>
                      <Badge className={`${STATUS_COLORS[status]} border-0 text-xs`}>
                        {count}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Search cases by name, account ID..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="pl-9"
                    aria-label="Search cases"
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
                    {(Object.entries(STATUS_LABELS) as [StatusType, string][]).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="cursor-pointer gap-2">
                  <Filter className="h-3 w-3" aria-hidden="true" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cases Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Active Cases ({records.length})
                </CardTitle>
                <Button variant="outline" size="sm" className="cursor-pointer gap-2">
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  Sort
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Priority</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Bucket</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No cases found. Import data to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record) => {
                        const priority = getPriorityLevel(record);
                        const daysOverdue = getDaysOverdue(record.dueDate);

                        return (
                          <TableRow
                            key={record.id}
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => setSelectedCase(record)}
                          >
                            <TableCell>
                              <Badge
                                className={`${PRIORITY_STYLES[priority]} border-0 text-[10px] uppercase`}
                              >
                                {priority}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {record.accountId}
                            </TableCell>
                            <TableCell className="font-medium">
                              {record.customerName}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      BUCKET_COLORS[record.bucket],
                                  }}
                                  aria-hidden="true"
                                />
                                <span className="text-sm">{record.bucket}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(record.outstandingAmount)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  daysOverdue > 90
                                    ? 'font-semibold text-destructive'
                                    : daysOverdue > 30
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-muted-foreground'
                                }
                              >
                                {daysOverdue}d
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${STATUS_COLORS[record.status]} border-0 text-xs`}
                              >
                                {STATUS_LABELS[record.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label="Case actions"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="cursor-pointer gap-2">
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer gap-2">
                                    <Phone className="h-4 w-4" aria-hidden="true" />
                                    Log Call
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer gap-2">
                                    <Mail className="h-4 w-4" aria-hidden="true" />
                                    Send Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer gap-2">
                                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                                    Send SMS
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateRecord(record.id, { status: 'contacted' });
                                    }}
                                  >
                                    Mark as Contacted
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateRecord(record.id, { status: 'promised' });
                                    }}
                                  >
                                    Mark as Promise to Pay
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Case Detail Panel */}
          {selectedCase && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Case Detail — {selectedCase.accountId}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setSelectedCase(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Customer Info
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Name</span>
                        <p className="font-medium">{selectedCase.customerName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Account ID</span>
                        <p className="font-mono text-sm">{selectedCase.accountId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Collection Info
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Outstanding</span>
                        <p className="text-lg font-bold">
                          {formatCurrency(selectedCase.outstandingAmount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Bucket</span>
                        <p>
                          {selectedCase.bucket} — {BUCKET_LABELS[selectedCase.bucket]}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Due Date</span>
                        <p>{formatDate(selectedCase.dueDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Actions
                    </h3>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="cursor-pointer gap-2">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        Call Customer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer gap-2"
                      >
                        <Mail className="h-3 w-3" aria-hidden="true" />
                        Send Reminder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer gap-2"
                      >
                        <MessageSquare className="h-3 w-3" aria-hidden="true" />
                        SMS Notification
                      </Button>
                    </div>
                  </div>
                </div>
                {selectedCase.notes && (
                  <div className="mt-4 rounded-md bg-muted p-3">
                    <span className="text-xs font-medium text-muted-foreground">Notes</span>
                    <p className="mt-1 text-sm">{selectedCase.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
