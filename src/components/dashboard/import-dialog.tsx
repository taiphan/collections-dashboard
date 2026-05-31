'use client';

import { useState, useCallback } from 'react';
import { useCollectionsStore } from '@/lib/store';
import { parseCSV, generateSampleCSV, ParseResult } from '@/lib/csv-parser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function ImportDialog() {
  const { addRecords } = useCollectionsStore();
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setParseResult({
        success: false,
        records: [],
        errors: [{ row: 0, field: 'file', message: 'Please upload a CSV file' }],
        totalRows: 0,
        validRows: 0,
      });
      return;
    }

    setIsProcessing(true);
    const result = await parseCSV(file);
    setParseResult(result);
    setIsProcessing(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = () => {
    if (parseResult && parseResult.records.length > 0) {
      addRecords(parseResult.records);
      setOpen(false);
      setParseResult(null);
    }
  };

  const handleDownloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-collections.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    setParseResult(null);
    setIsDragging(false);
    setIsProcessing(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetState();
      }}
    >
      <DialogTrigger render={<Button className="cursor-pointer gap-2" />}>
        <Upload className="h-4 w-4" aria-hidden="true" />
        Import Data
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Collection Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file with collection records. Required columns: account_id,
            customer_name, bucket (B1-B5), outstanding_amount, due_date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          {!parseResult && (
            <div
              className={`
                relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8
                transition-colors duration-200
                ${isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <FileText className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="mb-1 text-sm font-medium">
                {isProcessing ? 'Processing...' : 'Drop your CSV file here'}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Upload CSV file"
              />
            </div>
          )}

          {/* Parse results */}
          {parseResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {parseResult.validRows > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                )}
                <span className="text-sm font-medium">
                  {parseResult.validRows} of {parseResult.totalRows} rows valid
                </span>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-md bg-destructive/10 p-3">
                  <p className="mb-1 text-xs font-medium text-destructive">
                    Errors ({parseResult.errors.length}):
                  </p>
                  {parseResult.errors.slice(0, 5).map((error, i) => (
                    <p key={i} className="text-xs text-destructive/80">
                      Row {error.row}: {error.field} — {error.message}
                    </p>
                  ))}
                  {parseResult.errors.length > 5 && (
                    <p className="mt-1 text-xs text-destructive/60">
                      ...and {parseResult.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              )}

              {parseResult.validRows > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(['B1', 'B2', 'B3', 'B4', 'B5'] as const).map((bucket) => {
                    const count = parseResult.records.filter(
                      (r) => r.bucket === bucket
                    ).length;
                    if (count === 0) return null;
                    return (
                      <Badge key={bucket} variant="secondary">
                        {bucket}: {count} records
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="cursor-pointer gap-2"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              Sample CSV
            </Button>

            <div className="flex gap-2">
              {parseResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetState}
                  className="cursor-pointer"
                >
                  Upload Another
                </Button>
              )}
              {parseResult && parseResult.validRows > 0 && (
                <Button
                  size="sm"
                  onClick={handleImport}
                  className="cursor-pointer gap-2"
                >
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Import {parseResult.validRows} Records
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
