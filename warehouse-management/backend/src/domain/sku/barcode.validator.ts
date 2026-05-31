import { BarcodeFormat } from '@prisma/client';

export interface BarcodeValidationResult {
  valid: boolean;
  format?: BarcodeFormat;
  error?: string;
}

export function validateBarcode(value: string): BarcodeValidationResult {
  if (isValidEan13(value)) {
    return { valid: true, format: 'EAN_13' };
  }

  if (isValidUpcA(value)) {
    return { valid: true, format: 'UPC_A' };
  }

  if (isValidCode128(value)) {
    return { valid: true, format: 'CODE_128' };
  }

  return {
    valid: false,
    error: 'Barcode does not match any supported format (EAN-13, UPC-A, Code 128)',
  };
}

function isValidEan13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  return verifyCheckDigit(value);
}

function isValidUpcA(value: string): boolean {
  if (!/^\d{12}$/.test(value)) return false;
  return verifyCheckDigit(value);
}

function verifyCheckDigit(digits: string): boolean {
  const nums = digits.split('').map(Number);
  const checkDigit = nums.pop()!;
  let sum = 0;

  for (let i = 0; i < nums.length; i++) {
    sum += nums[i] * (i % 2 === 0 ? 1 : 3);
  }

  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}

function isValidCode128(value: string): boolean {
  if (value.length < 1 || value.length > 80) return false;
  // Code 128 supports ASCII 0-127
  return /^[\x00-\x7F]+$/.test(value) && !/^\d{12,13}$/.test(value);
}
