import { v4 as uuidv4 } from 'uuid';

const PREFIXES = {
  application: 'APP',
  case: 'CASE',
  customer: 'CUS',
} as const;

type EntityType = keyof typeof PREFIXES;

export function generateId(): string {
  return uuidv4();
}

export function generateEntityNumber(type: EntityType): string {
  const prefix = PREFIXES[type];
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
