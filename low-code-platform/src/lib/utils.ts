import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind class combiner — keeps the same `cn` API used by the rest of the workspace.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
