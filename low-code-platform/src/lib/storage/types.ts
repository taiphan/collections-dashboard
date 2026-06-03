/**
 * Storage adapter interface.
 *
 * Property 10 (attachment tenant-prefix) is enforced at the AttachmentService
 * level — adapters just persist whatever key they're given.
 */

export interface PutObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}

export interface ObjectStream {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  byteSize: number;
}

export interface StorageAdapter {
  put(input: PutObjectInput): Promise<void>;
  get(key: string): Promise<ObjectStream>;
  delete(key: string): Promise<void>;
}
