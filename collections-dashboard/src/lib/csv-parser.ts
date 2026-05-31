import Papa from 'papaparse';
import { z } from 'zod';
import { importRowSchema, ImportRow, CollectionRecord, BUCKET_NAMES } from './types';

export interface ParseResult {
  success: boolean;
  records: CollectionRecord[];
  errors: ParseError[];
  totalRows: number;
  validRows: number;
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const headerMap: Record<string, string> = {
    'account_id': 'accountId',
    'account id': 'accountId',
    'accountid': 'accountId',
    'customer_name': 'customerName',
    'customer name': 'customerName',
    'customername': 'customerName',
    'name': 'customerName',
    'bucket': 'bucket',
    'outstanding_amount': 'outstandingAmount',
    'outstanding amount': 'outstandingAmount',
    'outstandingamount': 'outstandingAmount',
    'amount': 'outstandingAmount',
    'due_date': 'dueDate',
    'due date': 'dueDate',
    'duedate': 'dueDate',
    'status': 'status',
    'notes': 'notes',
  };

  headers.forEach((header) => {
    const normalized = header.toLowerCase().trim();
    if (headerMap[normalized]) {
      mapping[header] = headerMap[normalized];
    }
  });

  return mapping;
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: ParseError[] = [];
        const records: CollectionRecord[] = [];
        const headers = results.meta.fields || [];
        const headerMapping = normalizeHeaders(headers);

        const rows = results.data as Record<string, string>[];

        rows.forEach((row, index) => {
          const mappedRow: Record<string, unknown> = {};

          Object.entries(row).forEach(([key, value]) => {
            const mappedKey = headerMapping[key];
            if (mappedKey) {
              if (mappedKey === 'outstandingAmount') {
                const cleaned = value.replace(/[,$\s]/g, '');
                mappedRow[mappedKey] = parseFloat(cleaned) || 0;
              } else if (mappedKey === 'bucket') {
                const upper = value.toUpperCase().trim();
                mappedRow[mappedKey] = BUCKET_NAMES.includes(upper as typeof BUCKET_NAMES[number])
                  ? upper
                  : value;
              } else {
                mappedRow[mappedKey] = value.trim();
              }
            }
          });

          const result = importRowSchema.safeParse(mappedRow);

          if (result.success) {
            records.push({
              id: generateId(),
              accountId: result.data.accountId,
              customerName: result.data.customerName,
              bucket: result.data.bucket,
              outstandingAmount: result.data.outstandingAmount,
              dueDate: result.data.dueDate,
              status: result.data.status || 'pending',
              notes: result.data.notes || '',
              importedAt: new Date().toISOString(),
            });
          } else {
            result.error.issues.forEach((issue) => {
              errors.push({
                row: index + 2, // +2 for header row and 0-index
                field: issue.path.join('.'),
                message: issue.message,
              });
            });
          }
        });

        resolve({
          success: errors.length === 0,
          records,
          errors,
          totalRows: rows.length,
          validRows: records.length,
        });
      },
      error: () => {
        resolve({
          success: false,
          records: [],
          errors: [{ row: 0, field: 'file', message: 'Failed to parse CSV file' }],
          totalRows: 0,
          validRows: 0,
        });
      },
    });
  });
}

export function generateSampleCSV(): string {
  const headers = 'account_id,customer_name,bucket,outstanding_amount,due_date,status,notes';
  const rows = [
    'ACC-001,Nguyen Van A,B1,5000000,2024-02-15,pending,First contact needed',
    'ACC-002,Tran Thi B,B2,12000000,2024-01-20,contacted,Called twice',
    'ACC-003,Le Van C,B3,8500000,2023-12-10,promised,Will pay by March',
    'ACC-004,Pham Thi D,B4,25000000,2023-11-05,pending,No response',
    'ACC-005,Hoang Van E,B5,45000000,2023-09-01,written-off,Bankrupt',
    'ACC-006,Vo Thi F,B1,3200000,2024-02-28,paid,Paid in full',
    'ACC-007,Dang Van G,B2,7800000,2024-01-15,contacted,Partial payment received',
    'ACC-008,Bui Thi H,B3,15600000,2023-12-20,pending,Under review',
    'ACC-009,Ngo Van I,B1,2100000,2024-03-01,pending,New account',
    'ACC-010,Do Thi K,B4,32000000,2023-10-15,contacted,Legal action pending',
  ];

  return [headers, ...rows].join('\n');
}
