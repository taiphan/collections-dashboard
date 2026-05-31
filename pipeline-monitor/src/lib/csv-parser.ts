import Papa from 'papaparse';
import { importRowSchema, PipelineRecord, DATA_SOURCES, DataSource } from './types';

export interface ParseResult {
  success: boolean;
  records: PipelineRecord[];
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
    'date': 'date',
    'report_date': 'date',
    'report date': 'date',
    'source': 'source',
    'data_source': 'source',
    'data source': 'source',
    'system': 'source',
    'bod_count': 'bodCount',
    'bod count': 'bodCount',
    'bod': 'bodCount',
    'source_count': 'bodCount',
    'source count': 'bodCount',
    'core_count': 'bodCount',
    'core count': 'bodCount',
    'pega_count': 'pegaCount',
    'pega count': 'pegaCount',
    'pega': 'pegaCount',
    'target_count': 'pegaCount',
    'target count': 'pegaCount',
  };

  headers.forEach((header) => {
    const normalized = header.toLowerCase().trim();
    if (headerMap[normalized]) {
      mapping[header] = headerMap[normalized];
    }
  });

  return mapping;
}

function normalizeSource(value: string): DataSource | null {
  const normalized = value.trim().toLowerCase();
  const sourceMap: Record<string, DataSource> = {
    'card v+': 'Card V+',
    'card v plus': 'Card V+',
    'cardv+': 'Card V+',
    'card': 'Card V+',
    'v+': 'Card V+',
    'loan finacle': 'Loan Finacle',
    'finacle': 'Loan Finacle',
    'loan': 'Loan Finacle',
  };
  return sourceMap[normalized] || null;
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: ParseError[] = [];
        const records: PipelineRecord[] = [];
        const headers = results.meta.fields || [];
        const headerMapping = normalizeHeaders(headers);

        const rows = results.data as Record<string, string>[];

        rows.forEach((row, index) => {
          const mappedRow: Record<string, unknown> = {};

          Object.entries(row).forEach(([key, value]) => {
            const mappedKey = headerMapping[key];
            if (mappedKey) {
              if (mappedKey === 'bodCount' || mappedKey === 'pegaCount') {
                const cleaned = value.replace(/[,\s]/g, '');
                mappedRow[mappedKey] = parseInt(cleaned, 10) || 0;
              } else if (mappedKey === 'source') {
                const normalized = normalizeSource(value);
                mappedRow[mappedKey] = normalized || value.trim();
              } else {
                mappedRow[mappedKey] = value.trim();
              }
            }
          });

          const result = importRowSchema.safeParse(mappedRow);

          if (result.success) {
            const bodCount = result.data.bodCount;
            const pegaCount = result.data.pegaCount;
            const difference = bodCount - pegaCount;
            const differencePercent = bodCount > 0
              ? ((bodCount - pegaCount) / bodCount) * 100
              : 0;

            records.push({
              id: generateId(),
              date: result.data.date,
              source: result.data.source,
              bodCount,
              pegaCount,
              difference,
              differencePercent,
              importedAt: new Date().toISOString(),
            });
          } else {
            result.error.issues.forEach((issue) => {
              errors.push({
                row: index + 2,
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
  const headers = 'date,source,bod_count,pega_count';
  const today = new Date();
  const rows: string[] = [];

  for (let i = 7; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Card V+ data with slight variations
    const cardBod = 15000 + Math.floor(Math.random() * 2000);
    const cardLoss = Math.floor(cardBod * (0.005 + Math.random() * 0.03));
    rows.push(`${dateStr},Card V+,${cardBod},${cardBod - cardLoss}`);

    // Loan Finacle data with slight variations
    const loanBod = 8000 + Math.floor(Math.random() * 1500);
    const loanLoss = Math.floor(loanBod * (0.008 + Math.random() * 0.025));
    rows.push(`${dateStr},Loan Finacle,${loanBod},${loanBod - loanLoss}`);
  }

  return [headers, ...rows].join('\n');
}
