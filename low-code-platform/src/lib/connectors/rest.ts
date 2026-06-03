/**
 * REST connector adapter. Uses the Web Fetch API; runs server-side only.
 *
 * Configuration shape (validated by the connector service):
 *   {
 *     baseUrl: string,
 *     defaultHeaders?: Record<string, string>,
 *     timeoutMs?: number  // default 10_000
 *   }
 *
 * Request shape:
 *   {
 *     inputs: { method, path, headers?, query?, body? }
 *   }
 *
 * MVP for V2.E ships the rest connector only. Other connector kinds throw
 * `not_implemented` until they ship.
 */

import { z } from 'zod';
import type { ConnectorAdapter, ConnectorRequest, ConnectorResponse } from './types';

const configSchema = z.object({
  baseUrl: z.string().url(),
  defaultHeaders: z.record(z.string(), z.string()).optional(),
  timeoutMs: z.number().int().positive().max(60_000).optional(),
});

const inputsSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().min(1).startsWith('/'),
  headers: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.unknown().optional(),
});

export const restConnector: ConnectorAdapter = {
  kind: 'rest',
  async invoke(rawConfig, _credentialRef, request: ConnectorRequest): Promise<ConnectorResponse> {
    const config = configSchema.parse(rawConfig);
    const inputs = inputsSchema.parse(request.inputs);

    const url = new URL(inputs.path, config.baseUrl);
    if (inputs.query) {
      for (const [k, v] of Object.entries(inputs.query)) {
        url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(config.defaultHeaders ?? {}),
      ...(inputs.headers ?? {}),
    };
    if (inputs.body != null && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const ctrl = new AbortController();
    const timeoutMs = config.timeoutMs ?? 10_000;
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const start = Date.now();

    try {
      const res = await fetch(url, {
        method: inputs.method,
        headers,
        body: inputs.body != null ? JSON.stringify(inputs.body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      let body: unknown = text;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json') && text.length > 0) {
        try {
          body = JSON.parse(text);
        } catch {
          // Leave as text on parse failure.
        }
      }
      return {
        status: res.status,
        ok: res.ok,
        body,
        elapsedMs: Date.now() - start,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};
