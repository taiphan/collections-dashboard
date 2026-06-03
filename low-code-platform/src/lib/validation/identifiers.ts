import { z } from 'zod';

/**
 * Identifier rules used across entities, fields, forms, case types, and step ids.
 * Letters, digits, underscore; must NOT start with a digit. (Requirement 3.6.)
 */
export const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const identifierSchema = z
  .string()
  .min(1, 'Identifier is required.')
  .max(80, 'Identifier must be 80 characters or fewer.')
  .regex(
    identifierPattern,
    'Identifier must use letters, digits, or underscores and must not start with a digit.',
  );

export const humanNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required.')
  .max(120, 'Name must be 120 characters or fewer.');
