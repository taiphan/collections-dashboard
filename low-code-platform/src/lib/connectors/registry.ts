/**
 * Connector registry. Static for MVP — only the REST adapter ships.
 * Other kinds (soap, db, file) throw `not_implemented` so case-types that
 * reference them surface a clear error instead of silently misbehaving.
 */

import { HttpError } from '@/lib/auth/errors';
import { restConnector } from './rest';
import type { ConnectorAdapter } from './types';

class NotImplementedAdapter implements ConnectorAdapter {
  constructor(public readonly kind: string) {}
  async invoke(): Promise<never> {
    throw new HttpError(501, 'not_implemented', `Connector kind "${this.kind}" is not implemented.`);
  }
}

const adapters: Record<string, ConnectorAdapter> = {
  rest: restConnector,
  soap: new NotImplementedAdapter('soap'),
  db: new NotImplementedAdapter('db'),
  file: new NotImplementedAdapter('file'),
};

export function getAdapter(kind: string): ConnectorAdapter {
  const adapter = adapters[kind];
  if (!adapter) {
    throw new HttpError(400, 'unknown_connector_kind', `Unknown connector kind "${kind}".`);
  }
  return adapter;
}
