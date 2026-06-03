/**
 * Connector adapter contract. (Pillar V2.E)
 *
 * Each adapter accepts a tenant-scoped configuration and a typed request
 * payload, returns a typed response payload. The Case Runtime invokes
 * adapters via `runConnectorStep`.
 */

export interface ConnectorRequest {
  /** Free-form input mapped from `primaryEntityData` by the case-type spec. */
  inputs: Record<string, unknown>;
  /** Optional override map; e.g. dynamic path or query params. */
  parameters?: Record<string, unknown>;
}

export interface ConnectorResponse {
  status: number;
  ok: boolean;
  /** Parsed body if JSON; otherwise the raw text. */
  body: unknown;
  /** Time taken in ms. */
  elapsedMs: number;
}

export interface ConnectorAdapter {
  readonly kind: string;
  invoke(
    config: Record<string, unknown>,
    credentialRef: string | null,
    request: ConnectorRequest,
  ): Promise<ConnectorResponse>;
}
