/**
 * Local-filesystem storage adapter for development.
 *
 * NOT for production. The `put` writes binaries under STORAGE_LOCAL_PATH
 * preserving the tenant-prefixed key as a directory hierarchy.
 */

import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { ObjectStream, PutObjectInput, StorageAdapter } from './types';

export class LocalFsStorage implements StorageAdapter {
  private root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private absolute(key: string): string {
    // Defensive: refuse keys that try to escape the root.
    if (key.includes('..')) throw new Error('Invalid storage key.');
    return join(this.root, key);
  }

  async put(input: PutObjectInput): Promise<void> {
    const path = this.absolute(input.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.body);
  }

  async get(key: string): Promise<ObjectStream> {
    const path = this.absolute(key);
    const meta = await stat(path);
    const buffer = await readFile(path);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });
    return {
      body: stream,
      contentType: 'application/octet-stream',
      byteSize: meta.size,
    };
  }

  async delete(key: string): Promise<void> {
    const path = this.absolute(key);
    try {
      await unlink(path);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err;
    }
  }
}
