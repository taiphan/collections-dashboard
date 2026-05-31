export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getPeriodRange(periodType: PeriodType, referenceDate: Date = new Date()): DateRange {
  const date = new Date(referenceDate);

  switch (periodType) {
    case 'daily': {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setMilliseconds(-1);
      return { start, end };
    }
    case 'weekly': {
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      end.setMilliseconds(-1);
      return { start, end };
    }
    case 'monthly': {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'quarterly': {
      const quarter = Math.floor(date.getMonth() / 3);
      const start = new Date(date.getFullYear(), quarter * 3, 1);
      const end = new Date(date.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'yearly': {
      const start = new Date(date.getFullYear(), 0, 1);
      const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }
}

export function isValidDateRange(start: Date, end: Date): boolean {
  return start <= end;
}
