'use client';

import { useState, useCallback } from 'react';
import { usePipelineStore } from '@/lib/store';
import { parseCSV, generateSampleCSV, ParseResult } from '@/lib/csv-parser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function ImportDialog() {
  const { addRecords } = usePipelineStore();
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(false);
      setParseResult(null);
    }
  };

  const handleDownloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-pipeline-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    setParseResult(null);
    setIsDragging(false);
    setIsProcessing(false);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="cursor-pointer gap-2">
        <Upload className="h-4 w-4" aria-hidden="true" />
        Import Data
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="mx-4 w-full max-w-lg rounded-xl bg-popover p-6 shadow-xl ring-1 ring-foreground/10"
        role="dialog"
        aria-labelledby="import-title"
      >
        <div className="mb-4">
          <h2 id="import-title" className="text-lg font-semibold">Import Pipeline Data</h2>
          <p className="text-sm text-muted-foreground">
            Upload a CSV with columns: date, source (Card V+ / Loan Finacle), bod_count, pega_count
          </p>
        </div>

        <div className="space-y-4">
          {!parseResult && (
            <div
              className={`
                relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8
                transition-colors duration-200
                ${isDragging
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-muted-foreground/25 hover:border-blue-500/50'
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
                  <Badge variant="secondary">
                    Card V+: {parseResult.records.filter((r) => r.source === 'Card V+').length} records
                  </Badge>
                  <Badge variant="secondary">
                    Loan Finacle: {parseResult.records.filter((r) => r.source === 'Loan Finacle').length} records
                  </Badge>
                </div>
              )}
            </div>
          )}

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  resetState();
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
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
      </div>
    </div>
  );
}
