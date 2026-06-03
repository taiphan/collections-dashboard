/**
 * Typed errors used by route handlers to convert into HTTP responses.
 * Keeping this module dependency-free so it can be imported from `proxy.ts`,
 * services, and the worker without dragging Next.js into shared bundles.
 */

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'HttpError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required.') {
    super(401, 'unauthorized', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(403, 'forbidden', message);
    this.name = 'ForbiddenError';
  }
}

export class TenantUnresolvedError extends HttpError {
  constructor() {
    super(400, 'tenant_unresolved', 'No tenant could be resolved for this request.');
    this.name = 'TenantUnresolvedError';
  }
}

export class TenantConflictError extends HttpError {
  constructor() {
    super(
      400,
      'tenant_conflict',
      'Subdomain and X-Tenant-Id header resolved to different tenants.',
    );
    this.name = 'TenantConflictError';
  }
}

export class ValidationFailedError extends HttpError {
  constructor(details: unknown, message = 'Validation failed.') {
    super(422, 'validation_failed', message, details);
    this.name = 'ValidationFailedError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found.') {
    super(404, 'not_found', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict.') {
    super(409, 'conflict', message);
    this.name = 'ConflictError';
  }
}

/**
 * Convert any error into a JSON Response. Unknown errors collapse into a
 * generic 500 — never include the original message in the body to avoid
 * leaking internal details.
 */
export function toHttpResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(
      {
        error: { code: error.code, message: error.message, details: error.details ?? null },
      },
      { status: error.status },
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled error in route handler:', error);
  }

  return Response.json(
    { error: { code: 'internal', message: 'Internal server error.' } },
    { status: 500 },
  );
}
