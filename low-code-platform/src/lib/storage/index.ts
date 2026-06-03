/**
 * Storage adapter factory.
 */

import { LocalFsStorage } from './local-fs';
import type { StorageAdapter } from './types';

let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  const driver = process.env.STORAGE_DRIVER ?? 'local-fs';
  switch (driver) {
    case 'local-fs':
      cached = new LocalFsStorage(process.env.STORAGE_LOCAL_PATH ?? './storage-local');
      return cached;
    case 's3':
      throw new Error('S3 storage adapter is not yet implemented (MVP scope).');
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
  }
}

export type { StorageAdapter, PutObjectInput, ObjectStream } from './types';
